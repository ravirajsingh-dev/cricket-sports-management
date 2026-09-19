const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const User = require("../../../models/User");
const Session = require("../../../models/Session");

const response = require("../../../config/response");
const { generateTokens } = require("../../../shared/utils/authUtils");
const {
  logSecurityEvent,
  EVENT_TYPES,
} = require("../../../shared/utils/auditLogger");

const {
  comparePasswords,
} = require("../../../shared/utils/helper");
const UserDetails = require("../../../models/UserDetails");

const {
  setAuthTokenCookie,
  setAuthRefreshTokenCookie,
  setSessionIDCookie,
  clearUserAuthCookies,
} = require("../../../shared/utils/cookieUtils");
const CommonSettings = require("../../../models/CommonSettings");
const {
  sanitizeValidationErrors,
} = require("../../../shared/utils/errorSanitizer");
const {
  checkBruteForceProtection,
  recordFailedAttempt,
  resetAttempts,
} = require("../../../shared/utils/bruteForceProtection");
module.exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.errorResponse(
      res,
      sanitizeValidationErrors(errors.array()),
      "Validation Error",
      400,
    );
  }

  try {
    // Check if login is enabled
    const settings = await CommonSettings.getOrCreateSettings();
    if (!settings.loginEnabled) {
      return response.errorResponse(
        res,
        {
          msg: "Service temporarily unavailable. Please contact administrator.",
        },
        "Service temporarily unavailable.",
        503,
      );
    }

    const { memberId, password } = req.body;

    if (!memberId || !password) {
      return response.errorResponse(
        res,
        { msg: "Invalid credentials" },
        "Invalid credentials",
        400,
      );
    }

    // Check brute-force protection before processing login
    const bruteForceCheck = await checkBruteForceProtection(memberId);
    if (bruteForceCheck.isBlocked) {
      // Log blocked login attempt
      logSecurityEvent({
        eventType: EVENT_TYPES.USER_LOGIN_FAILURE,
        status: "fail",
        req,
        details: {
          reason:
            "Account temporarily blocked due to too many failed login attempts",
          memberId,
          blockedUntil: bruteForceCheck.blockedUntil,
        },
      });

      return response.errorResponse(
        res,
        [
          {
            path: "memberId",
            msg: `Account temporarily locked due to too many failed login attempts. Please try again after ${bruteForceCheck.remainingMinutes} minute(s).`,
          },
        ],
        "Account temporarily locked",
        429,
      );
    }

    // Find user by memberId
    const user = await User.findOne({ memberId });

    if (!user) {
      // Record failed login attempt
      await recordFailedAttempt(memberId);

      // Log failed login attempt
      logSecurityEvent({
        eventType: EVENT_TYPES.USER_LOGIN_FAILURE,
        status: "fail",
        req,
        details: { reason: "User not found", memberId },
      });

      return response.errorResponse(
        res,
        [
          {
            path: "memberId",
            msg: "Invalid credentials",
          },
        ],
        "Invalid credentials",
        401,
      );
    }

    // Check user status
    // status = 3 (Blocked) → block login
    if (user.status === 3) {
      // Record failed login attempt
      await recordFailedAttempt(memberId);

      // Log blocked account login attempt
      logSecurityEvent({
        eventType: EVENT_TYPES.USER_LOGIN_FAILURE,
        status: "fail",
        userID: user._id.toString(),
        req,
        details: { reason: "Account blocked", memberId },
      });

      return response.errorResponse(
        res,
        [
          {
            path: "memberId",
            msg: "Account access denied. Please contact support.",
          },
        ],
        "Account access denied",
        403,
      );
    }

    // status = 2 (Inactive) → allow login
    // Admin-deactivated accounts can be reactivated manually by admin

    // status = 1 (Active) or status = 4 (New) or status = 2 (Inactive) → allow login

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Record failed login attempt
      await recordFailedAttempt(memberId);

      // Log failed login attempt (invalid password)
      logSecurityEvent({
        eventType: EVENT_TYPES.USER_LOGIN_FAILURE,
        status: "fail",
        userID: user._id.toString(),
        req,
        details: { reason: "Invalid password", memberId },
      });

      return response.errorResponse(
        res,
        [
          {
            path: "password",
            msg: "Invalid credentials",
          },
        ],
        "Invalid credentials",
        400,
      );
    }

    const { accessToken, refreshToken, sessionID } = await generateTokens(
      user,
      req,
    );

    // Reset brute-force protection on successful login
    await resetAttempts(memberId);

    // Update last_login field
    user.last_login = new Date();
    await user.save();

    // Log successful login
    logSecurityEvent({
      eventType: EVENT_TYPES.USER_LOGIN_SUCCESS,
      status: "success",
      userID: user._id.toString(),
      req,
      details: { memberId },
    });

    // Create sanitized user object without sensitive fields
    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.txn_password;

    setAuthTokenCookie(res, accessToken, "user_");
    setAuthRefreshTokenCookie(res, refreshToken, "user_");
    // Set sessionID cookie for cookie-based authentication
    setSessionIDCookie(res, sessionID, "user_");

    return response.successResponse(
      res,
      {
        user: sanitizedUser,
      },
      "Login successful",
    );
  } catch (err) {
    console.error("Login error:", err);
    return response.errorResponse(res, {}, "An error occurred", 500);
  }
};

module.exports.checkAuth = async (req, res) => {
  try {
    if (!req.user) {
      return response.successResponse(res, null, "Not authenticated.");
    }

    const userId = req.user.id;

    if (!userId) {
      return response.errorResponse(
        res,
        { msg: "Invalid request" },
        "Invalid request",
        400,
      );
    }

    // Find the user by ID
    const user = await User.findById(userId)
      .select("-password")
      .populate("playingRole", "name amount isActive")
      .lean();

    // If user is not found, return error
    if (!user) {
      return response.errorResponse(
        res,
        { msg: "Resource not found" },
        "Resource not found",
        404,
      );
    }

    // Fetch user details if exists
    const userDetails = await UserDetails.findOne({ userId: user._id }).lean();

    // Combine user and userDetails
    const userData = {
      ...user,
      userDetails: userDetails || null,
    };
    delete userData.txn_password;
    delete userData.password;

    return response.successResponse(res, userData, "User details");
  } catch (err) {
    console.error("Check auth error:", err);
    return response.errorResponse(res, {}, "An error occurred", 500);
  }
};

module.exports.logout = async (req, res) => {
  const sessionID = req.cookies?.user_sessionID;
  const userId = req.user?.id;

  try {
    if (sessionID && userId) {
      const deletedSession = await Session.findOneAndDelete({
        userID: userId,
        sessionID,
      });

      if (deletedSession) {
        logSecurityEvent({
          eventType: EVENT_TYPES.SESSION_REMOVED,
          status: "success",
          userID: userId.toString(),
          req,
          details: { sessionID: deletedSession.sessionID },
        });
      }
    }
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    // Always clear cookies so the client cannot re-auth after logout.
    clearUserAuthCookies(res);
  }

  return response.successResponse(res, {}, "Logged out successfully.");
};

module.exports.logoutAll = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return response.errorResponse(
        res,
        { msg: "Invalid user ID" },
        "Invalid user ID",
        400,
      );
    }

    // Delete all sessions for this user (logout from all devices)
    const deletedCount = await Session.deleteMany({ userID: userId });

    // Log session removal (all devices)
    logSecurityEvent({
      eventType: EVENT_TYPES.SESSION_REMOVED_ALL,
      status: "success",
      userID: userId.toString(),
      req,
      details: { sessionsRemoved: deletedCount.deletedCount || 0 },
    });

    clearUserAuthCookies(res);

    return response.successResponse(
      res,
      {},
      "Logged out from all devices successfully.",
    );
  } catch (err) {
    console.error("Logout all error:", err);
    clearUserAuthCookies(res);
    return response.errorResponse(res, {}, "An error occurred", 500);
  }
};

module.exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.errorResponse(
      res,
      sanitizeValidationErrors(errors.array()),
      "Validation Error",
      400,
    );
  }
  try {
    const userId = req.user.id;

    if (!userId) {
      return response.errorResponse(
        res,
        { msg: "Invalid request" },
        "Invalid request",
        400,
      );
    }

    const { oldPassword, password } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "Invalid request" },
        "Invalid request",
        400,
      );
    }

    const validPassword = await comparePasswords(oldPassword, user.password);

    if (!validPassword) {
      return response.errorResponse(
        res,
        [
          {
            path: "oldPassword",
            msg: "Invalid credentials",
          },
        ],
        "Invalid credentials",
        400,
      );
    }

    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(password, salt);

    let updatedUser = await User.findByIdAndUpdate(
      { _id: userId },
      {
        password: newPassword,
        passwordChangedAt: new Date(), // Track password change timestamp
      },
      { returnDocument: "after" },
    ).lean();

    if (!updatedUser) {
      return response.errorResponse(
        res,
        { msg: "Resource not found" },
        "Resource not found",
        401,
      );
    }

    // Invalidate all sessions for this user after password change
    // This ensures all devices are logged out immediately
    await Session.deleteMany({ userID: userId });

    // Log password change
    logSecurityEvent({
      eventType: EVENT_TYPES.USER_PASSWORD_CHANGE,
      status: "success",
      userID: userId.toString(),
      req,
    });

    return response.successResponse(res, {}, "Password change successfully.");
  } catch (err) {
    console.error("Change password error:", err);
    return response.errorResponse(res, {}, "An error occurred", 403);
  }
};
