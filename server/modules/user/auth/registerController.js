const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const User = require("../../../models/User");
const PlayingRole = require("../../../models/PlayingRole");
const CommonSettings = require("../../../models/CommonSettings");
const response = require("../../../config/response");
const {
  sanitizeError,
} = require("../../../shared/utils/errorSanitizer");
const emailService = require("../../../infra/email");
const { generateMemberId } = require("../../../shared/utils/helper");
const {
  toTitleCase,
  validateEmail,
} = require("../../../shared/utils/inputValidation");

const register = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const settings = await CommonSettings.getOrCreateSettings();
    if (!settings.registerEnabled) {
      return response.errorResponse(
        res,
        [{ msg: "Registration is currently disabled." }],
        "Registration is currently disabled.",
        403,
      );
    }

    const { name, phone, email, password, playingRole, state, stateId, city, cityId } =
      req.body;

    if (!name || !phone || !email || !password) {
      return response.errorResponse(
        res,
        [{ msg: "Name, phone, email, and password are required." }],
        "Validation Error",
        400,
      );
    }

    if (!playingRole) {
      return response.errorResponse(
        res,
        [{ path: "playingRole", msg: "Please select your role." }],
        "Validation Error",
        400,
      );
    }

    const stateName = String(state || "").trim();
    const cityName = String(city || "").trim();
    const parsedStateId = Number(stateId);
    const parsedCityId = Number(cityId);

    if (!stateName || !parsedStateId) {
      return response.errorResponse(
        res,
        [{ path: "state", msg: "Please select your state." }],
        "Validation Error",
        400,
      );
    }

    if (!cityName || !parsedCityId) {
      return response.errorResponse(
        res,
        [{ path: "city", msg: "Please select your city." }],
        "Validation Error",
        400,
      );
    }

    const phoneStr = String(phone).trim();
    if (phoneStr.length !== 10) {
      return response.errorResponse(
        res,
        [{ path: "phone", msg: "Phone number must be 10 digits." }],
        "Validation Error",
        400,
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return response.errorResponse(
        res,
        [{ path: "email", msg: emailValidation.error }],
        "Validation Error",
        400,
      );
    }
    const emailStr = emailValidation.sanitized;

    const selectedRole = await PlayingRole.findOne({
      _id: playingRole,
      isActive: true,
    }).lean();
    if (!selectedRole) {
      return response.errorResponse(
        res,
        [{ path: "playingRole", msg: "Selected role is not available." }],
        "Validation Error",
        400,
      );
    }

    let user;

    await session.withTransaction(async () => {
      const existingPhone = await User.findOne({ phone: phoneStr }).session(
        session,
      );
      if (existingPhone) {
        const err = new Error("Phone number already registered");
        err.statusCode = 400;
        err.path = "phone";
        throw err;
      }

      const existingEmail = await User.findOne({ email: emailStr }).session(
        session,
      );
      if (existingEmail) {
        const err = new Error("Email is already registered");
        err.statusCode = 400;
        err.path = "email";
        throw err;
      }

      const memberId = await generateMemberId(phoneStr, session);

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const uuid = uuidv4();

      user = new User({
        memberId,
        name: toTitleCase(String(name)),
        phone: phoneStr,
        email: emailStr,
        password: hashedPassword,
        status: 1,
        uuid,
        playingRole: selectedRole._id,
        country: "India",
        countryId: 101,
        state: stateName,
        stateId: parsedStateId,
        city: cityName,
        cityId: parsedCityId,
      });

      await user.save({ session });
    });

    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;

    try {
      await emailService.sendActiveUserWelcomeEmail({
        name: user.name,
        email: user.email,
        memberId: user.memberId,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    return response.successResponse(
      res,
      {
        user: sanitizedUser,
        credentials: {
          memberId: user.memberId,
        },
      },
      "Registration successful.",
    );
  } catch (err) {
    console.error("Registration error:", err);

    if (err.path && err.statusCode === 400) {
      return response.errorResponse(
        res,
        [{ path: err.path, msg: err.message }],
        "Validation Error",
        400,
      );
    }

    if (
      err.message &&
      (err.message.includes("abbreviation is not configured") ||
        err.message.includes("Member ID collision"))
    ) {
      return response.errorResponse(
        res,
        [{ path: "memberId", msg: err.message }],
        "Validation Error",
        400,
      );
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "phone";
      const msg =
        field === "email"
          ? "Email is already registered"
          : field === "phone"
            ? "Phone number already registered"
            : "Duplicate field error";
      return response.errorResponse(
        res,
        [{ path: field, msg }],
        "Duplicate field error",
        400,
      );
    }

    if (err.message) {
      const sanitizedMsg = sanitizeError(err.message, "validation");
      return response.errorResponse(
        res,
        [{ msg: sanitizedMsg }],
        sanitizedMsg,
        400,
      );
    }

    return response.errorResponse(res, {}, "An error occurred", 500);
  } finally {
    await session.endSession();
  }
};

module.exports = {
  register,
};
