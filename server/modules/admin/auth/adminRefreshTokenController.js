const Admin = require("../../../models/Admin");
const SubAdmin = require("../../../models/SubAdmin");
const {
  createRefreshTokenHandler,
} = require("../../../shared/utils/refreshTokenHandler");

const resolveAdminAccount = async (decoded) => {
  let admin;
  if (decoded.role === 2) {
    admin = await Admin.findById(decoded.id);
  } else if (decoded.role === 3) {
    admin = await SubAdmin.findById(decoded.id);
  } else {
    admin = await Admin.findById(decoded.id);
    if (!admin) {
      admin = await SubAdmin.findById(decoded.id);
    }
  }
  return admin;
};

const adminRefreshToken = createRefreshTokenHandler({
  cookiePrefix: "admin_",
  resolveAccount: resolveAdminAccount,
  // Preserve prior admin error payload shapes (arrays).
  errors: {
    missingToken: [{ msg: "Refresh token is required." }],
    missingTokenMessage: "Invalid Request.",
    invalidSession: [
      { msg: "Invalid token or session ID. Please log in again." },
    ],
    invalidSessionMessage: "Invalid token.",
    accountNotFound: [{ msg: "Admin not found." }],
    accountNotFoundMessage: "Admin not found.",
    passwordChanged: [
      { msg: "Your password has been changed. Please log in again." },
    ],
    passwordChangedMessage: "Invalid token.",
    invalidToken: {},
    invalidTokenMessage: "Invalid token.",
  },
});

module.exports = adminRefreshToken;
