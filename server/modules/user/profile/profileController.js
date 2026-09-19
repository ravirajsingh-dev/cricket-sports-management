const { validationResult } = require("express-validator");
const response = require("../../../config/response");
const User = require("../../../models/User");
const UserDetails = require("../../../models/UserDetails");
const mongoose = require("mongoose");
const { toTitleCase, validateEmail } = require("../../../shared/utils/inputValidation");
const {
  getProfileRequirementsResponse,
} = require("../../../config/profileRequirements");

/**
 * GET /api/user/profile
 * Get complete user profile (User + UserDetails)
 * @access Private
 */
const getProfile = async (req, res) => {
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

    // Get user data (exclude sensitive fields)
    const user = await User.findById(userId)
      .select("-password")
      .lean();

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found" },
        "User not found",
        404,
      );
    }

    // Get user details
    const userDetails = await UserDetails.findOne({ userId }).lean();

    // Combine user and userDetails
    const profileData = {
      ...user,
      userDetails: userDetails || null,
    };

    return response.successResponse(
      res,
      profileData,
      "Profile retrieved successfully",
    );
  } catch (err) {
    console.error("Error in getProfile:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * PUT /api/user/profile
 * Update user profile (User + UserDetails)
 * CRITICAL: Member ID and Phone are IMMUTABLE
 * @access Private
 */
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Map express-validator errors to consistent format with path and msg
      const formattedErrors = errors.array().map((error) => ({
        path: error.path || error.param || "unknown",
        msg: error.msg || error.message || "Validation failed",
      }));
      return response.errorResponse(
        res,
        formattedErrors,
        "Validation Error",
        400,
      );
    }

    const userId = req.user.id;

    if (!userId) {
      return response.errorResponse(
        res,
        { msg: "Invalid user ID" },
        "Invalid user ID",
        400,
      );
    }

    // CRITICAL: Remove memberId and phone from request body if present
    // These fields are PERMANENT and must never change
    const { memberId, phone, ...updateData } = req.body;

    // If memberId or phone are in the request, reject the update
    if (memberId !== undefined || phone !== undefined) {
      return response.errorResponse(
        res,
        [
          { path: "memberId", msg: "Member ID cannot be changed" },
          { path: "phone", msg: "Phone number cannot be changed" },
        ],
        "Invalid Update Request",
        400,
      );
    }

    // Get current user to verify existence
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return response.errorResponse(
        res,
        { msg: "User not found" },
        "User not found",
        404,
      );
    }

    // Start transaction for atomic updates
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Separate User fields from UserDetails fields based on schema
      const userFields = {};
      const userDetailsFields = {};

      // Get schema paths for validation
      const userSchemaPaths = User.schema.paths;
      const userDetailsSchemaPaths = UserDetails.schema.paths;

      // Get allowed fields from schema
      const allowedUserFields = [
        "name",
        "email",
        "address",
        "country",
        "countryId",
        "state",
        "stateId",
        "city",
        "cityId",
      ];

      const allowedUserDetailsFieldsFromSchema = Object.keys(
        userDetailsSchemaPaths,
      ).filter(
        (key) =>
          !["_id", "__v", "createdAt", "updatedAt", "userId"].includes(key),
      );

      // UserDetails model fields (schema-defined)
      const baseUserDetailsFields = ["dob", "gender", "height", "weight"];
      const allowedUserDetailsFields = baseUserDetailsFields.filter((field) =>
        allowedUserDetailsFieldsFromSchema.includes(field),
      );

      // Validate and separate fields - reject unknown fields
      const validationErrors = [];
      Object.keys(updateData).forEach((key) => {
        if (
          !allowedUserFields.includes(key) &&
          !allowedUserDetailsFields.includes(key)
        ) {
          validationErrors.push({
            path: key,
            msg: `Field '${key}' is not allowed`,
          });
        }
      });

      if (validationErrors.length > 0) {
        await session.abortTransaction();
        session.endSession();
        return response.errorResponse(
          res,
          validationErrors,
          "Validation Error",
          400,
        );
      }

      // Validate and collect User fields
      Object.keys(updateData).forEach((key) => {
        if (allowedUserFields.includes(key)) {
          userFields[key] = updateData[key];
        } else if (allowedUserDetailsFields.includes(key)) {
          userDetailsFields[key] = updateData[key];
        }
      });

      // Validate name if provided
      if (userFields.name !== undefined) {
        const nameStr = userFields.name ? String(userFields.name).trim() : "";
        if (nameStr) {
          const namePath = userSchemaPaths.name;
          if (namePath.minlength && nameStr.length < namePath.minlength) {
            await session.abortTransaction();
            session.endSession();
            return response.errorResponse(
              res,
              [
                {
                  path: "name",
                  msg: `Name must be at least ${namePath.minlength} characters`,
                },
              ],
              "Validation Error",
              400,
            );
          }
          if (namePath.maxlength && nameStr.length > namePath.maxlength) {
            await session.abortTransaction();
            session.endSession();
            return response.errorResponse(
              res,
              [
                {
                  path: "name",
                  msg: `Name must be at most ${namePath.maxlength} characters`,
                },
              ],
              "Validation Error",
              400,
            );
          }
          if (/<[^>]*>/g.test(nameStr)) {
            await session.abortTransaction();
            session.endSession();
            return response.errorResponse(
              res,
              [
                {
                  path: "name",
                  msg: "Name cannot contain HTML or script tags",
                },
              ],
              "Validation Error",
              400,
            );
          }
          if (/\$[a-zA-Z]+/.test(nameStr)) {
            await session.abortTransaction();
            session.endSession();
            return response.errorResponse(
              res,
              [{ path: "name", msg: "Name contains invalid characters" }],
              "Validation Error",
              400,
            );
          }
          userFields.name = toTitleCase(nameStr);
        } else if (userSchemaPaths.name.isRequired) {
          await session.abortTransaction();
          session.endSession();
          return response.errorResponse(
            res,
            [{ path: "name", msg: "Name is required" }],
            "Validation Error",
            400,
          );
        }
      }

      // Validate email if provided
      if (userFields.email !== undefined) {
        const emailStr = userFields.email
          ? String(userFields.email).trim()
          : "";
        if (emailStr) {
          const emailValidation = validateEmail(emailStr);
          if (!emailValidation.valid) {
            await session.abortTransaction();
            session.endSession();
            return response.errorResponse(
              res,
              [{ path: "email", msg: emailValidation.error }],
              "Validation Error",
              400,
            );
          }
          const existingUser = await User.findOne({
            email: emailValidation.sanitized,
            _id: { $ne: userId },
          }).session(session);
          if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            return response.errorResponse(
              res,
              [{ path: "email", msg: "Email is already registered" }],
              "Validation Error",
              400,
            );
          }
          userFields.email = emailValidation.sanitized;
        } else if (userSchemaPaths.email.isRequired) {
          await session.abortTransaction();
          session.endSession();
          return response.errorResponse(
            res,
            [{ path: "email", msg: "Email is required" }],
            "Validation Error",
            400,
          );
        }
      }

      // Validate UserDetails fields
      if (userDetailsFields.dob !== undefined) {
        if (userDetailsFields.dob) {
          const dobDate = new Date(userDetailsFields.dob);
          if (isNaN(dobDate.getTime())) {
            await session.abortTransaction();
            session.endSession();
            return response.errorResponse(
              res,
              [{ path: "dob", msg: "Date of birth must be a valid date" }],
              "Validation Error",
              400,
            );
          }
          userDetailsFields.dob = dobDate;
        } else if (userDetailsSchemaPaths.dob.isRequired) {
          await session.abortTransaction();
          session.endSession();
          return response.errorResponse(
            res,
            [{ path: "dob", msg: "Date of birth is required" }],
            "Validation Error",
            400,
          );
        }
      }

      if (userDetailsFields.gender !== undefined) {
        const genderPath = userDetailsSchemaPaths.gender;
        if (userDetailsFields.gender) {
          if (
            genderPath.enumValues &&
            !genderPath.enumValues.includes(userDetailsFields.gender)
          ) {
            await session.abortTransaction();
            session.endSession();
            return response.errorResponse(
              res,
              [
                {
                  path: "gender",
                  msg: `Gender must be one of: ${genderPath.enumValues.join(", ")}`,
                },
              ],
              "Validation Error",
              400,
            );
          }
        } else if (genderPath.isRequired) {
          await session.abortTransaction();
          session.endSession();
          return response.errorResponse(
            res,
            [{ path: "gender", msg: "Gender is required" }],
            "Validation Error",
            400,
          );
        }
      }

      if (
        userDetailsFields.height !== undefined &&
        userDetailsFields.height !== "" &&
        userDetailsFields.height !== null
      ) {
        const heightNum = Number(userDetailsFields.height);
        if (Number.isNaN(heightNum)) {
          await session.abortTransaction();
          session.endSession();
          return response.errorResponse(
            res,
            [{ path: "height", msg: "Height must be a valid number" }],
            "Validation Error",
            400,
          );
        }
        const heightPath = userDetailsSchemaPaths.height;
        if (heightPath.min !== undefined && heightNum < heightPath.min) {
          await session.abortTransaction();
          session.endSession();
          return response.errorResponse(
            res,
            [
              {
                path: "height",
                msg: `Height must be at least ${heightPath.min}`,
              },
            ],
            "Validation Error",
            400,
          );
        }
        if (heightPath.max !== undefined && heightNum > heightPath.max) {
          await session.abortTransaction();
          session.endSession();
          return response.errorResponse(
            res,
            [
              {
                path: "height",
                msg: `Height must be at most ${heightPath.max}`,
              },
            ],
            "Validation Error",
            400,
          );
        }
        userDetailsFields.height = heightNum;
      }

      if (
        userDetailsFields.weight !== undefined &&
        userDetailsFields.weight !== "" &&
        userDetailsFields.weight !== null
      ) {
        const weightNum = Number(userDetailsFields.weight);
        if (Number.isNaN(weightNum)) {
          await session.abortTransaction();
          session.endSession();
          return response.errorResponse(
            res,
            [{ path: "weight", msg: "Weight must be a valid number" }],
            "Validation Error",
            400,
          );
        }
        const weightPath = userDetailsSchemaPaths.weight;
        if (weightPath.min !== undefined && weightNum < weightPath.min) {
          await session.abortTransaction();
          session.endSession();
          return response.errorResponse(
            res,
            [
              {
                path: "weight",
                msg: `Weight must be at least ${weightPath.min}`,
              },
            ],
            "Validation Error",
            400,
          );
        }
        if (weightPath.max !== undefined && weightNum > weightPath.max) {
          await session.abortTransaction();
          session.endSession();
          return response.errorResponse(
            res,
            [
              {
                path: "weight",
                msg: `Weight must be at most ${weightPath.max}`,
              },
            ],
            "Validation Error",
            400,
          );
        }
        userDetailsFields.weight = weightNum;
      }

      // Update User if there are fields to update
      let updatedUser = currentUser;
      if (Object.keys(userFields).length > 0) {
        updatedUser = await User.findByIdAndUpdate(
          userId,
          { $set: userFields },
          { returnDocument: "after", runValidators: true, session },
        )
          .select("-password")
          .lean();
      }

      // Update or create UserDetails
      let userDetails = await UserDetails.findOne({ userId }).session(session);

      if (Object.keys(userDetailsFields).length > 0) {
        const updateOp = { $set: userDetailsFields };
        updateOp.$setOnInsert = {
          userId: new mongoose.Types.ObjectId(userId),
        };

        userDetails = await UserDetails.findOneAndUpdate(
          { userId },
          updateOp,
          {
            returnDocument: "after",
            upsert: true,
            runValidators: true,
            session,
            setDefaultsOnInsert: true,
          },
        ).lean();
      } else {
        if (userDetails) {
          userDetails = await UserDetails.findOne({ userId }).lean();
        }
      }

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Combine updated user and userDetails
      const profileData = {
        ...updatedUser,
        userDetails: userDetails || null,
      };

      return response.successResponse(
        res,
        profileData,
        "Profile updated successfully",
      );
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    console.error("Error in updateProfile:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((error) => ({
        path: error.path,
        msg: error.message,
      }));
      return response.errorResponse(res, errors, "Validation Error", 400);
    }
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * GET /api/users/profile-requirements
 * Field requirements for profile completion (single source of truth).
 * @access Private
 */
const getProfileRequirements = async (req, res) => {
  try {
    return response.successResponse(
      res,
      getProfileRequirementsResponse(),
      "Profile requirements retrieved successfully",
    );
  } catch (err) {
    console.error("Error in getProfileRequirements:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getProfileRequirements,
};
