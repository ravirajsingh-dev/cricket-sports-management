const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const {
  validatePhoneField,
  validateEmailField,
} = require("../../../shared/middleware/inputValidation");

const { register } = require("./registerController");

router.post(
  "/register",
  [
    check("name", "Name is required")
      .isString()
      .trim()
      .notEmpty()
      .isLength({ min: 1, max: 150 })
      .custom((value) => {
        if (/<[^>]*>/g.test(value)) {
          throw new Error("Name cannot contain HTML or script tags");
        }
        if (/\$[a-zA-Z]+/.test(value)) {
          throw new Error("Name contains invalid characters");
        }
        return true;
      }),

    validatePhoneField("phone", { required: true }),
    validateEmailField("email", { required: true }),

    check("playingRole", "Please select your role")
      .isString()
      .trim()
      .notEmpty()
      .isMongoId()
      .withMessage("Please select a valid role"),

    check("state", "Please select your state").isString().trim().notEmpty(),
    check("stateId", "Please select your state").isInt({ min: 1 }),
    check("city", "Please select your city").isString().trim().notEmpty(),
    check("cityId", "Please select your city").isInt({ min: 1 }),

    check("password", "Password must be at least 8 characters long")
      .isLength({ min: 8 })
      .custom((value) => {
        if (/<[^>]*>/g.test(value)) {
          throw new Error("Password cannot contain HTML or script tags");
        }
        return true;
      }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      await register(req, res);
    } catch (error) {
      console.error("Error handling user registration:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

module.exports = router;
