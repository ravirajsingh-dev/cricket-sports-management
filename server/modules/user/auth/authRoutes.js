const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const {
  validateMemberIdField,
  validateEmailField,
} = require("../../../shared/middleware/inputValidation");

// Custom imports
const {
  login,
  logout,
  logoutAll,
  checkAuth,
  changePassword,
} = require("./authController");
const refreshToken = require("./userRefreshTokenController");
const { UserAuth, OptionalUserAuth } = require("../../../shared/middleware/auth");
const standard_password = require("../../../shared/constants/passwordPolicy");
const {
  PASSWORD_POLICY,
  passwordHasNoHtml,
} = standard_password;

// @route POST api/auth
// @desc Authenticate user
// @access Public
router.post(
  "/",
  [
    validateMemberIdField("memberId"),
    check("password", "Password is required")
      .not()
      .isEmpty()
      .withMessage("Password is required")
      .custom((value) => {
        // Reject HTML/script tags
        if (/<[^>]*>/g.test(value)) {
          throw new Error("Password cannot contain HTML or script tags");
        }
        return true;
      }),
  ],
  login,
);

// @route PUT api/auth/logout
// @desc Logout user from current device
// @access Private (requires authentication)
router.put("/logout", UserAuth, logout);

// @route PUT api/auth/logout-all
// @desc Logout user from all devices
// @access Private (requires authentication)
router.put("/logout-all", UserAuth, logoutAll);

// @route GET api/auth/load-user
// @desc Load authenticated user
// @access Private
router.get("/load-user", OptionalUserAuth, checkAuth);

// @route POST api/auth/refresh-token
// @desc Refresh access token
// @access Private (requires authentication)
router.post("/refresh-token", refreshToken);

// @route POST api/auth/change-password
// @desc Change password
// @access Private (requires authentication)
router.post(
  "/change-password",
  UserAuth,
  [
    check("oldPassword", "Old password is required")
      .not()
      .isEmpty()
      .withMessage("Old password is required")
      .custom((value) => {
        // Reject HTML/script tags
        if (/<[^>]*>/g.test(value)) {
          throw new Error("Password cannot contain HTML or script tags");
        }
        return true;
      }),
    check("password", "Password is required")
      .not()
      .isEmpty()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .custom((value) => {
        // Reject HTML/script tags
        if (/<[^>]*>/g.test(value)) {
          throw new Error("Password cannot contain HTML or script tags");
        }
        return true;
      }),
  ],
  changePassword,
);

const {
  verifyMemberId,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPasswordWithOtp,
  resendForgotPasswordOtp,
} = require("./forgotPasswordOtpController");

// @route POST api/auth/forgot-password-email/verify-member-id
// @desc Verify Member ID and return masked email
// @access Public
router.post(
  "/forgot-password-email/verify-member-id",
  [validateMemberIdField("memberId")],
  verifyMemberId,
);

// @route POST api/auth/forgot-password-email/send-otp
// @desc Send OTP to email for password reset (after Member ID verification)
// @access Public
router.post(
  "/forgot-password-email/send-otp",
  [validateMemberIdField("memberId"), validateEmailField("email")],
  sendForgotPasswordOtp,
);

// @route POST api/auth/forgot-password-email/resend-otp
// @desc Resend OTP to email for password reset
// @access Public
router.post(
  "/forgot-password-email/resend-otp",
  [validateMemberIdField("memberId")],
  resendForgotPasswordOtp,
);

// @route POST api/auth/forgot-password-email/verify-otp
// @desc Verify OTP for password reset
// @access Public
router.post(
  "/forgot-password-email/verify-otp",
  [
    validateMemberIdField("memberId"),
    check("otp", "OTP is required")
      .trim()
      .not()
      .isEmpty()
      .withMessage("OTP cannot be empty")
      .matches(/^\d{6}$/)
      .withMessage("OTP must be exactly 6 digits"),
  ],
  verifyForgotPasswordOtp,
);

// @route POST api/auth/forgot-password-email/reset
// @desc Reset password after OTP verification
// @access Public
router.post(
  "/forgot-password-email/reset",
  [
    validateMemberIdField("memberId"),
    check("otp", "OTP is required")
      .trim()
      .not()
      .isEmpty()
      .withMessage("OTP cannot be empty")
      .matches(/^\d{6}$/)
      .withMessage("OTP must be exactly 6 digits"),
    check("password", standard_password.validation_msg)
      .not()
      .isEmpty()
      .isLength({
        min: PASSWORD_POLICY.minLength,
        max: PASSWORD_POLICY.maxLength,
      })
      .withMessage(standard_password.validation_msg)
      .matches(standard_password.validation_pattern)
      .withMessage(standard_password.validation_msg)
      .custom((value) => {
        if (!passwordHasNoHtml(value)) {
          throw new Error("Password cannot contain HTML or script tags");
        }
        return true;
      }),
    check("confirmPassword", "Confirm Password is required")
      .not()
      .isEmpty()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
  ],
  resetPasswordWithOtp,
);

module.exports = router;
