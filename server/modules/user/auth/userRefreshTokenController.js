const User = require("../../../models/User");
const {
  createRefreshTokenHandler,
} = require("../../../shared/utils/refreshTokenHandler");

const refreshToken = createRefreshTokenHandler({
  cookiePrefix: "user_",
  resolveAccount: async (decoded) => User.findById(decoded.id),
  // Preserve prior user error payload shapes (objects for most; array for session).
  errors: {
    missingToken: { msg: "Refresh token is required." },
    missingTokenMessage: "Invalid Request.",
    invalidSession: [
      { msg: "Invalid token or session ID. Please log in again." },
    ],
    invalidSessionMessage: "Invalid token.",
    accountNotFound: { msg: "User not found." },
    accountNotFoundMessage: "Invalid token.",
    passwordChanged: {
      msg: "Your password has been changed. Please log in again.",
    },
    passwordChangedMessage: "Invalid token.",
    invalidToken: {},
    invalidTokenMessage: "Invalid token.",
  },
});

module.exports = refreshToken;
