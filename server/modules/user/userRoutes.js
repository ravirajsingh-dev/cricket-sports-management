const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { userProtected } = require("../../shared/middleware/userProtected");
const {
  getProfile,
  updateProfile,
  getProfileRequirements,
} = require("./profile/profileController");

// @route GET api/users/profile
// @desc Get complete user profile (User + UserDetails)
// @access Private
router.get("/profile", userProtected, getProfile);

// @route GET api/users/profile-requirements
// @desc Get profile field requirements (source of truth for client)
// @access Private
router.get(
  "/profile-requirements",
  userProtected,
  getProfileRequirements,
);

// @route PUT api/users/profile
// @desc Update user profile (User + UserDetails)
// @access Private
// CRITICAL: Member ID and Phone are immutable
router.put(
  "/profile",
  [
    ...userProtected,
    [
      check("name")
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage("Name must be between 3 and 50 characters")
        .custom((value) => {
          if (value && /<[^>]*>/g.test(value)) {
            throw new Error("Name cannot contain HTML or script tags");
          }
          if (value && /\$[a-zA-Z]+/.test(value)) {
            throw new Error("Name contains invalid characters");
          }
          return true;
        }),
      check("email")
        .optional()
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
      check("dob")
        .optional()
        .isISO8601()
        .withMessage("Date of birth must be a valid date"),
      check("gender")
        .optional()
        .isIn(["male", "female", "other"])
        .withMessage("Gender must be one of: male, female, other"),
      check("height")
        .optional()
        .isFloat({ min: 0, max: 300 })
        .withMessage("Height must be between 0 and 300"),
      check("weight")
        .optional()
        .isFloat({ min: 0, max: 500 })
        .withMessage("Weight must be between 0 and 500"),
    ],
  ],
  updateProfile,
);

module.exports = router;
