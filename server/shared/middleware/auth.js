const jwt = require("jsonwebtoken");
const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = require("../../config/config");
const Admin = require("../../models/Admin");
const SubAdmin = require("../../models/SubAdmin");
const User = require("../../models/User");
const Session = require("../../models/Session");
const { rotateRefreshToken, resolveSession } = require("../utils/authUtils");
const response = require("../../config/response");
const logger = require("../utils/logger");

const unauthorized = (res, message = "Session expired. Please login again.", statusCode = 401) =>
  response.errorResponse(
    res,
    { msg: message, tokenStatus: 0 },
    message,
    statusCode,
  );


const verifyToken = async (req, res, next, role = null, { optional = false } = {}) => {
  // Read tokens from HttpOnly cookies only — no Authorization header fallback.
  // Role-scoped prefixes: user_* vs admin_* (legacy unprefixed names are never read).
  let token, refreshToken, sessionID;

  if (role === 1) {
    // USER routes: only user_ cookies
    token = req.cookies?.user_token;
    refreshToken = req.cookies?.user_refreshToken;
    sessionID = req.cookies?.user_sessionID;
  } else if (role === 2) {
    // ADMIN routes: only admin_ cookies
    token = req.cookies?.admin_token;
    refreshToken = req.cookies?.admin_refreshToken;
    sessionID = req.cookies?.admin_sessionID;
  } else {
    // Common routes (role === null): prefer user_, then admin_
    token = req.cookies?.user_token || req.cookies?.admin_token;
    refreshToken =
      req.cookies?.user_refreshToken || req.cookies?.admin_refreshToken;
    sessionID =
      req.cookies?.user_sessionID || req.cookies?.admin_sessionID;
  }

  if (!token || !refreshToken || !sessionID) {
    if (optional) {
      req.user = null;
      return next();
    }
    return unauthorized(res, "Session expired. Please login again.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded;
  } catch (err) {
    if (err.name !== "TokenExpiredError") {
      return unauthorized(res, "Session expired. Please login again.");
    }
  }

  try {
    // If access token is expired, decode refresh token to get user ID for session lookup
    let userIdForSession = null;
    if (!decoded) {
      try {
        const tempDecoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        userIdForSession = tempDecoded.id;
      } catch (err) {
        // Will be handled later in refresh token verification
      }
    } else {
      userIdForSession = decoded.id;
    }

    const resolved = await resolveSession({
      userID: userIdForSession,
      sessionID,
      refreshToken,
    });

    if (!resolved) {
      return unauthorized(res, "Session expired. Please login again.");
    }

    const { session, cookiesNeedSync } = resolved;

    if (!session.isActive) {
      return unauthorized(res, "Session expired. Please login again.");
    }

    if (
      session.refreshTokenExpiresAt &&
      session.refreshTokenExpiresAt < new Date()
    ) {
      await Session.findByIdAndUpdate(session._id, { isActive: false });
      return unauthorized(res, "Session expired. Please login again.");
    }

    let user;
    let isAdmin = false;
    let isSubAdmin = false;
    // If token is expired, we need to decode refresh token first to get user ID
    if (!decoded) {
      try {
        const decodedRefreshToken = jwt.verify(
          refreshToken,
          JWT_REFRESH_SECRET,
        );
        // Check if it's an admin (role 2), sub-admin (role 3), or user (no role or role 1)
        if (decodedRefreshToken.role === 2) {
          user = await Admin.findById(decodedRefreshToken.id);
          isAdmin = true;
        } else if (decodedRefreshToken.role === 3) {
          user = await SubAdmin.findById(decodedRefreshToken.id);
          isSubAdmin = true;
        } else {
          user = await User.findById(decodedRefreshToken.id);
        }
      } catch (refreshErr) {
        return unauthorized(res, "Session expired. Please login again.");
      }
    } else {
      // Try Admin first (if role is 2)
      if (decoded.role === 2) {
        user = await Admin.findById(decoded.id);
        if (user) isAdmin = true;
      }
      // Try SubAdmin (if role is 3)
      if (!user && decoded.role === 3) {
        user = await SubAdmin.findById(decoded.id);
        if (user) isSubAdmin = true;
      }
      // If not admin/sub-admin or not found, try User
      if (!user) {
        user = await User.findById(decoded.id);
      }
    }

    if (!user) {
      return unauthorized(res, "Session expired. Please login again.");
    }

    // SECURITY: Verify role consistency between token and database
    // Determine expected role from database user model
    let expectedRole = 1; // Default to user role
    if (isAdmin) {
      expectedRole = 2; // Admin role
    } else if (isSubAdmin) {
      expectedRole = 3; // SubAdmin role
    }

    // Compare decoded token role with database role
    // Check both access token (if decoded) and refresh token role
    let tokenRole = null;
    if (decoded && decoded.role !== undefined) {
      tokenRole = decoded.role;
    } else {
      // If access token expired, check refresh token role
      try {
        const tempDecodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        if (tempDecodedRefresh.role !== undefined) {
          tokenRole = tempDecodedRefresh.role;
        }
      } catch (err) {
        // Will be handled later in refresh token verification
      }
    }

    // If we have both token role and user from DB, verify they match
    if (tokenRole !== null) {
      if (tokenRole !== expectedRole) {
        // Role mismatch detected - potential token tampering or role escalation attempt
        // Deactivate session immediately
        await Session.findByIdAndUpdate(session._id, { isActive: false });
        return unauthorized(res, "Session expired. Please login again.", 403);
      }
    }

    // Check user status - for User model: 1=Active, 2=Inactive, 3=Blocked, 4=New
    // status 2 must be allowed so inactive members can still authenticate.
    if (!isAdmin && !isSubAdmin) {
      if (user.status === 3) {
        return unauthorized(res, "Account access denied. Please contact support.", 403);
      }
    } else if (isAdmin) {
      // Admin status check
      if (user.status === 2) {
        return unauthorized(res, "Account access denied. Please contact support.", 403);
      }
    } else if (isSubAdmin) {
      // SubAdmin status check - check both status and isActive
      if (user.status === 2 || !user.isActive) {
        return unauthorized(res, "Account access denied. Please contact support.", 403);
      }
    }

    // Verify token validity against password change timestamp
    // If password was changed after token was issued, token is invalid
    if (decoded && user.passwordChangedAt) {
      const tokenIssuedAt = decoded.iat * 1000; // Convert to milliseconds
      const passwordChangedAt = new Date(user.passwordChangedAt).getTime();

      if (tokenIssuedAt < passwordChangedAt) {
        // Token was issued before password change - invalidate session
        await Session.findByIdAndUpdate(session._id, { isActive: false });
        return unauthorized(res, "Session expired. Please login again.");
      }
    }

    if (decoded) {
      if (user.uuid !== decoded.uuid) {
        return unauthorized(res, "Session expired. Please login again.");
      }

      // If Admin auth required, ensure user is admin or sub-admin
      if (role === 2 && !isAdmin && !isSubAdmin) {
        return unauthorized(res, "Insufficient permissions. Admin access required.", 403);
      }

      // If User auth required, ensure user is not admin or sub-admin
      if (role === 1 && (isAdmin || isSubAdmin)) {
        return unauthorized(res, "Insufficient permissions. User access required.", 403);
      }

      req.userObj = user;
      req.isAdmin = isAdmin;
      req.isSubAdmin = isSubAdmin;

      if (cookiesNeedSync) {
        // Stale refresh cookie after concurrent rotation — mint a fresh pair
        // (raw tokens are no longer stored in the session document).
        try {
          const syncedTokens = await rotateRefreshToken(
            user,
            session,
            refreshToken,
          );
          const prefixToUse = isAdmin || isSubAdmin ? "admin_" : "user_";
          const { setSessionAuthCookies } = require("../utils/cookieUtils");
          setSessionAuthCookies(res, syncedTokens, prefixToUse);
        } catch (syncErr) {
          console.warn("[auth] cookie sync rotation failed:", syncErr.message);
        }
      }

      return next();
    }

    // Access token expired — if another request just rotated, mint tokens for this client.
    if (cookiesNeedSync) {
      try {
        const syncedTokens = await rotateRefreshToken(
          user,
          session,
          refreshToken,
        );
        const syncedDecoded = jwt.verify(
          syncedTokens.accessToken,
          JWT_ACCESS_SECRET,
        );
        if (syncedDecoded.id !== user._id.toString()) {
          return unauthorized(res, "Session expired. Please login again.");
        }

        req.user = syncedDecoded;
        req.userObj = user;
        req.isAdmin = isAdmin;
        req.isSubAdmin = isSubAdmin;

        const prefixToUse = isAdmin || isSubAdmin ? "admin_" : "user_";
        const { setSessionAuthCookies } = require("../utils/cookieUtils");
        setSessionAuthCookies(res, syncedTokens, prefixToUse);

        return next();
      } catch {
        // Fall through to normal refresh rotation below.
      }
    }

    // If token is expired, verify the refresh token
    try {
      const decodedRefreshToken = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      // SECURITY: Verify role consistency between refresh token and database
      // Determine expected role from database user model (already determined above)
      if (
        decodedRefreshToken.role !== undefined &&
        decodedRefreshToken.role !== expectedRole
      ) {
        // Role mismatch detected - potential token tampering or role escalation attempt
        // Deactivate session immediately
        await Session.findByIdAndUpdate(session._id, { isActive: false });
        return unauthorized(res, "Session expired. Please login again.", 403);
      }

      // Verify user ID and UUID match
      if (decodedRefreshToken.id !== user._id.toString()) {
        return unauthorized(res, "Session expired. Please login again.");
      }

      // Check UUID only if it exists in user model
      if (
        user.uuid &&
        decodedRefreshToken.uuid &&
        user.uuid !== decodedRefreshToken.uuid
      ) {
        return unauthorized(res, "Session expired. Please login again.");
      }

      // Role check for admin routes - allow both admin and sub-admin
      if (role === 2 && !isAdmin && !isSubAdmin) {
        return unauthorized(res, "Insufficient permissions. Admin access required.", 403);
      }

      // Role check for user routes
      if (role === 1 && (isAdmin || isSubAdmin)) {
        return unauthorized(res, "Insufficient permissions. User access required.", 403);
      }

      // Verify refresh token validity against password change timestamp
      if (user.passwordChangedAt) {
        const refreshTokenIssuedAt = decodedRefreshToken.iat * 1000; // Convert to milliseconds
        const passwordChangedAt = new Date(user.passwordChangedAt).getTime();

        if (refreshTokenIssuedAt < passwordChangedAt) {
          // Refresh token was issued before password change - invalidate session
          await Session.findByIdAndUpdate(session._id, { isActive: false });
          return unauthorized(res, "Session expired. Please login again.");
        }
      }

      // SECURITY: Rotate refresh token - invalidate old one and generate new one
      // This prevents token reuse and replay attacks
      const newTokens = await rotateRefreshToken(user, session, refreshToken);
      // Set tokens in cookies only - no headers
      // Always determine prefix from user type (admin/sub-admin vs user) to ensure correct cookies
      const prefixToUse = isAdmin || isSubAdmin ? "admin_" : "user_";
      const { setSessionAuthCookies } = require("../utils/cookieUtils");
      setSessionAuthCookies(res, newTokens, prefixToUse);

      const newDecodedToken = jwt.verify(
        newTokens.accessToken,
        JWT_ACCESS_SECRET,
      );

      // SECURITY: Verify newly generated token has correct role matching database
      if (
        newDecodedToken.role !== undefined &&
        newDecodedToken.role !== expectedRole
      ) {
        // Role mismatch in newly generated token - critical security issue
        // Deactivate session immediately
        await Session.findByIdAndUpdate(session._id, { isActive: false });
        return unauthorized(res, "Session expired. Please login again.", 403);
      }

      req.user = newDecodedToken;
      req.userObj = user;
      req.isAdmin = isAdmin;
      req.isSubAdmin = isSubAdmin;
      return next();
    } catch (refreshError) {
      console.error("Refresh token verification error:", refreshError);
      return unauthorized(res, "Session expired. Please login again.");
    }
  } catch (err) {
    console.error("Token verification error:", err);
    logger.error("Auth middleware failure");
    return unauthorized(res, "An error occurred", 500);
  }
};

const AdminAuth = (req, res, next) => verifyToken(req, res, next, 2);
const UserAuth = (req, res, next) => verifyToken(req, res, next, 1);
/** Soft session probe — missing cookies continue with req.user = null (HTTP 200 from checkAuth). */
const OptionalAdminAuth = (req, res, next) =>
  verifyToken(req, res, next, 2, { optional: true });
const OptionalUserAuth = (req, res, next) =>
  verifyToken(req, res, next, 1, { optional: true });

module.exports = {
  AdminAuth,
  UserAuth,
  OptionalAdminAuth,
  OptionalUserAuth,
};
