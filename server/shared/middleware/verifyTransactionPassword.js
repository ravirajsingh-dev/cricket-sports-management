const response = require("../../config/response");
const Admin = require("../../models/Admin");
const SubAdmin = require("../../models/SubAdmin");
const { comparePasswords } = require("../utils/helper");
const {
  checkBruteForceProtection,
  recordFailedAttempt,
  resetAttempts,
} = require("../utils/bruteForceProtection");

/**
 * Middleware to verify transaction password for destructive actions
 * Requires txn_password in request body
 * Works for both Admin and SubAdmin
 */
const verifyTransactionPassword = async (req, res, next) => {
  try {
    // Security: Reject transaction password from query parameters
    if (req.query?.txn_password) {
      return response.errorResponse(
        res,
        { msg: "Transaction password cannot be provided via query parameters for security reasons." },
        "Transaction password cannot be provided via query parameters for security reasons.",
        400
      );
    }

    // Only accept transaction password from request body
    const txn_password = req.body?.txn_password;

    if (!txn_password) {
      return response.errorResponse(
        res,
        { msg: "Transaction password is required." },
        "Transaction password is required.",
        400
      );
    }

    // Get admin/sub-admin ID from request (set by AdminAuth middleware)
    const userId = req.user?.id;
    if (!userId) {
      return response.errorResponse(
        res,
        { msg: "User not authenticated." },
        "Authentication required.",
        401
      );
    }

    const identifier = `txn:${userId}`;

    // Check brute-force protection before verifying password
    const bruteForceCheck = await checkBruteForceProtection(identifier);
    if (bruteForceCheck.isBlocked) {
      const minutesMsg = bruteForceCheck.remainingMinutes
        ? ` Please try again after ${bruteForceCheck.remainingMinutes} minute(s).`
        : "";
      return response.errorResponse(
        res,
        {
          msg: `Too many failed transaction password attempts. Account temporarily locked.${minutesMsg}`,
        },
        "Too many failed transaction password attempts.",
        429
      );
    }

    // Try Admin first, then SubAdmin
    let user = await Admin.findById(userId);
    let isSubAdmin = false;

    if (!user) {
      user = await SubAdmin.findById(userId);
      if (user) {
        isSubAdmin = true;
      }
    } else {
      // Check if it's actually a SubAdmin
      const subAdminCheck = await SubAdmin.findById(userId);
      if (subAdminCheck) {
        user = subAdminCheck;
        isSubAdmin = true;
      }
    }

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        404
      );
    }

    // Check if user has transaction password set
    if (!user.txn_password) {
      return response.errorResponse(
        res,
        {
          msg: "Transaction password not set. Please set your transaction password first.",
        },
        "Transaction password not set.",
        400
      );
    }

    // Validate transaction password
    const validPassword = await comparePasswords(
      txn_password,
      user.txn_password
    );
    if (!validPassword) {
      await recordFailedAttempt(identifier);
      const afterFail = await checkBruteForceProtection(identifier);
      const attemptsHint =
        afterFail.remainingAttempts > 0
          ? ` ${afterFail.remainingAttempts} attempt(s) remaining.`
          : afterFail.isBlocked && afterFail.remainingMinutes
            ? ` Locked for ${afterFail.remainingMinutes} minute(s).`
            : "";

      return response.errorResponse(
        res,
        [
          {
            path: "txn_password",
            msg: `Incorrect transaction password. Please double-check your credentials and try again.${attemptsHint}`,
          },
        ],
        "Incorrect Transaction Password.",
        400
      );
    }

    // Password verified — clear failed attempts and continue
    await resetAttempts(identifier);
    next();
  } catch (err) {
    console.error("Transaction password verification error:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = verifyTransactionPassword;
