const jwt = require("jsonwebtoken");

const Session = require("../../models/Session");
const response = require("../../config/response");
const { JWT_REFRESH_SECRET } = require("../../config/config");
const { rotateRefreshToken, resolveSession } = require("./authUtils");
const { setSessionAuthCookies } = require("./cookieUtils");

/**
 * Factory for user/admin refresh-token handlers.
 *
 * @param {object} options
 * @param {"user_"|"admin_"} options.cookiePrefix
 * @param {(decoded: object) => Promise<object|null>} options.resolveAccount
 * @param {object} [options.errors] - per-controller error payload shapes
 * @param {any} [options.errors.missingToken]
 * @param {string} [options.errors.missingTokenMessage]
 * @param {any} [options.errors.invalidSession]
 * @param {string} [options.errors.invalidSessionMessage]
 * @param {any} [options.errors.accountNotFound]
 * @param {string} [options.errors.accountNotFoundMessage]
 * @param {any} [options.errors.passwordChanged]
 * @param {string} [options.errors.passwordChangedMessage]
 * @param {any} [options.errors.invalidToken]
 * @param {string} [options.errors.invalidTokenMessage]
 */
const createRefreshTokenHandler = ({
  cookiePrefix,
  resolveAccount,
  errors = {},
}) => {
  const {
    missingToken = [{ msg: "Refresh token is required." }],
    missingTokenMessage = "Invalid Request.",
    invalidSession = [
      { msg: "Invalid token or session ID. Please log in again." },
    ],
    invalidSessionMessage = "Invalid token.",
    accountNotFound = [{ msg: "Account not found." }],
    accountNotFoundMessage = "Invalid token.",
    passwordChanged = [
      { msg: "Your password has been changed. Please log in again." },
    ],
    passwordChangedMessage = "Invalid token.",
    invalidToken = {},
    invalidTokenMessage = "Invalid token.",
  } = errors;

  return async (req, res) => {
    const receivedRefreshToken = req.cookies?.[`${cookiePrefix}refreshToken`];
    const sessionID = req.cookies?.[`${cookiePrefix}sessionID`];

    if (!receivedRefreshToken) {
      return response.errorResponse(
        res,
        missingToken,
        missingTokenMessage,
        400,
      );
    }

    try {
      const decoded = jwt.verify(receivedRefreshToken, JWT_REFRESH_SECRET);

      const resolved = await resolveSession({
        userID: decoded.id,
        sessionID,
        refreshToken: receivedRefreshToken,
      });

      if (!resolved) {
        return response.errorResponse(
          res,
          invalidSession,
          invalidSessionMessage,
          401,
        );
      }

      const { session } = resolved;
      const account = await resolveAccount(decoded);

      if (!account) {
        return response.errorResponse(
          res,
          accountNotFound,
          accountNotFoundMessage,
          401,
        );
      }

      if (account.passwordChangedAt) {
        const refreshTokenIssuedAt = decoded.iat * 1000;
        const passwordChangedAt = new Date(account.passwordChangedAt).getTime();

        if (refreshTokenIssuedAt < passwordChangedAt) {
          await Session.findByIdAndUpdate(session._id, { isActive: false });
          return response.errorResponse(
            res,
            passwordChanged,
            passwordChangedMessage,
            401,
          );
        }
      }

      // Always mint a new pair (hashes only in DB). cookiesNeedSync means the
      // incoming refresh matched the previous hash after a concurrent rotation.
      const tokens = await rotateRefreshToken(
        account,
        session,
        receivedRefreshToken,
      );
      setSessionAuthCookies(res, tokens, cookiePrefix);

      return response.successResponse(res, {}, "Token refreshed successfully.");
    } catch (err) {
      console.error("Error during token refresh:", err);
      return response.errorResponse(
        res,
        invalidToken,
        invalidTokenMessage,
        403,
      );
    }
  };
};

module.exports = { createRefreshTokenHandler };
