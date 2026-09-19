const response = require("../../../config/response");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const User = require("../../../models/User");
const UserDetails = require("../../../models/UserDetails");
const Session = require("../../../models/Session");
const { processSearchFilters } = require("../../../shared/utils/searchHelper");
const { generateMemberId } = require("../../../shared/utils/helper");
const {
  validateEmail,
  validatePhone,
  toTitleCase,
} = require("../../../shared/utils/inputValidation");
const {
  sanitizeError,
  sanitizeDuplicateKeyError,
  sanitizeValidationErrors,
} = require("../../../shared/utils/errorSanitizer");

const ADMIN_USER_LIST_FIELDS = [
  "memberId",
  "name",
  "phone",
  "email",
  "status",
  "createdAt",
  "search",
];

const ADMIN_USER_DETAILS_LIST_FIELDS = [];

/**
 * Build post-lookup $match for UserDetails fields (Search Member style).
 */
function buildUserDetailsListMatch(filters, query) {
  const userDetailsFilters = (filters || []).filter((f) =>
    ADMIN_USER_DETAILS_LIST_FIELDS.includes(f),
  );
  if (userDetailsFilters.length === 0) return {};

  const andFilter = [];
  userDetailsFilters.forEach((key) => {
    const filter = query?.[key];
    if (!filter) return;
    const { value, type } = filter;
    if (value == null || value === "" || !type) return;

    const fieldName = key.replace("userDetails.", "");

    switch (type) {
      case "id":
        if (mongoose.Types.ObjectId.isValid(value)) {
          andFilter.push({
            [`userDetails.${fieldName}`]: new mongoose.Types.ObjectId(value),
          });
        }
        break;
      case "String":
      case "string":
        andFilter.push({
          [`userDetails.${fieldName}`]: String(value).trim(),
        });
        break;
      default:
        break;
    }
  });

  return andFilter.length > 0 ? { $and: andFilter } : {};
}

/**
 * GET /admin/users/list
 * Get users list with pagination, search, and filters
 */
const getUsersList = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      orderBy = "createdAt",
      ascending = "desc",
    } = req.query || req.body;

    let filters = [];
    let query = {};

    if (req.query.limit) {
      if (typeof req.query.filters === "string") {
        filters = req.query.filters.split(",");
      } else if (Array.isArray(req.query.filters)) {
        filters = req.query.filters;
      }

      if (typeof req.query.query === "string") {
        try {
          query = JSON.parse(req.query.query);
        } catch (e) {
          query = {};
        }
      } else if (typeof req.query.query === "object") {
        query = req.query.query;
      } else {
        query = {};
      }
    } else {
      if (typeof req.body.filters === "string") {
        filters = req.body.filters.split(",");
      } else if (Array.isArray(req.body.filters)) {
        filters = req.body.filters;
      }

      query = typeof req.body.query === "object" ? req.body.query : {};
    }

    const pageSize = Math.min(parseInt(limit), 100);
    const skip = pageSize * (page - 1);
    const sortOrder = ascending === "desc" ? -1 : 1;

    const userFilters = (filters || []).filter((f) =>
      ADMIN_USER_LIST_FIELDS.includes(f),
    );
    const userQuery = {};
    Object.keys(query || {}).forEach((key) => {
      if (ADMIN_USER_LIST_FIELDS.includes(key)) {
        userQuery[key] = query[key];
      }
    });

    const matchQuery = processSearchFilters(userFilters, userQuery);
    const userDetailsMatchQuery = buildUserDetailsListMatch(filters, query);

    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "user_details",
          localField: "_id",
          foreignField: "userId",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (Object.keys(userDetailsMatchQuery).length > 0) {
      pipeline.push({ $match: userDetailsMatchQuery });
    }

    pipeline.push(
      {
        $lookup: {
          from: "playing_roles",
          localField: "playingRole",
          foreignField: "_id",
          as: "playingRoleDoc",
        },
      },
      {
        $project: {
          memberId: 1,
          name: 1,
          phone: 1,
          email: 1,
          status: 1,
          isVerified: 1,
          createdAt: 1,
          updatedAt: 1,
          playingRole: {
            $let: {
              vars: {
                role: { $arrayElemAt: ["$playingRoleDoc", 0] },
              },
              in: {
                $cond: [
                  { $ifNull: ["$$role", false] },
                  {
                    _id: "$$role._id",
                    name: "$$role.name",
                    amount: "$$role.amount",
                  },
                  null,
                ],
              },
            },
          },
          userDetails: {
            dob: "$userDetails.dob",
            gender: "$userDetails.gender",
            height: "$userDetails.height",
            weight: "$userDetails.weight",
          },
        },
      },
      {
        $facet: {
          metadata: [
            { $count: "totalRecord" },
            {
              $addFields: {
                current_page: parseInt(page),
                per_page: pageSize,
              },
            },
          ],
          data: [
            { $sort: { [orderBy]: sortOrder } },
            { $skip: skip },
            { $limit: pageSize },
          ],
        },
      },
    );

    const usersList = await User.aggregate(pipeline).collation({
      locale: "en",
      strength: 1,
    });

    const [result] = usersList;

    if (result?.metadata?.length > 0) {
      return response.successResponse(res, usersList, "Users List");
    } else {
      return response.successResponse(
        res,
        [
          {
            metadata: [
              { totalRecord: 0, current_page: page, per_page: pageSize },
            ],
            data: [],
          },
        ],
        "No Users",
      );
    }
  } catch (err) {
    console.error("Error fetching users:", err);
    return response.errorResponse(res, {}, "An error occurred", 500);
  }
};

/**
 * Slim user_details shape for admin Edit User GET — IDs and profile fields only.
 */
const ADMIN_EDIT_USER_DETAILS_LOOKUP_PIPELINE = [
  {
    $project: {
      dob: 1,
      gender: 1,
      height: 1,
      weight: 1,
    },
  },
];

/**
 * Load slim admin Edit User payload (same shape for GET and PUT responses).
 * Returns null when the user does not exist.
 */
async function fetchAdminEditUserById(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [row] = await User.aggregate([
    { $match: { _id: userObjectId } },
    {
      $project: {
        memberId: 1,
        name: 1,
        phone: 1,
        email: 1,
        status: 1,
        country: 1,
        countryId: 1,
        state: 1,
        stateId: 1,
        city: 1,
        cityId: 1,
        address: 1,
      },
    },
    {
      $lookup: {
        from: "user_details",
        let: { uid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$userId", "$$uid"],
              },
            },
          },
          ...ADMIN_EDIT_USER_DETAILS_LOOKUP_PIPELINE,
        ],
        as: "userDetails",
      },
    },
    {
      $addFields: {
        userDetails: { $arrayElemAt: ["$userDetails", 0] },
      },
    },
  ]);

  if (!row) return null;

  const userData = { ...row };

  // Phase 0: never decrypt/expose reversible password copies to clients

  if (!userData.userDetails) {
    userData.userDetails = null;
  }

  return userData;
}

/**
 * GET /admin/users/:userId
 * Get user by ID with UserDetails (slim payload for admin Edit User).
 *
 * Admins may set a new password via the change-password field;
 * existing passwords cannot be viewed (bcrypt-only).
 */
const getUserById = async (req, res) => {
  try {
    const userId = req.params.user_id || req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.errorResponse(
        res,
        { msg: "Invalid resource identifier" },
        "Invalid resource identifier",
        400,
      );
    }

    const userData = await fetchAdminEditUserById(userId);

    if (!userData) {
      return response.errorResponse(
        res,
        { msg: "Resource not found" },
        "Resource not found",
        404,
      );
    }

    return response.successResponse(res, userData, "User data");
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return response.errorResponse(
        res,
        { msg: "Resource not found" },
        "Resource not found",
        404,
      );
    }
    console.error("Get user by ID error:", err);
    return response.errorResponse(res, {}, "An error occurred", 500);
  }
};

const ADMIN_CREATE_USER_FIELDS = [
  "name",
  "phone",
  "email",
  "password",
  "state",
  "stateId",
  "city",
  "cityId",
  "country",
  "countryId",
];

/**
 * POST /admin/users
 * Create new user with core information only (name, phone, email, password).
 * Additional profile details can be added later via edit user.
 */
const createUser = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const unknownFields = Object.keys(req.body).filter(
      (key) => !ADMIN_CREATE_USER_FIELDS.includes(key),
    );
    if (unknownFields.length > 0) {
      session.endSession();
      return response.errorResponse(
        res,
        unknownFields.map((field) => ({
          path: field,
          msg: `Field '${field}' is not allowed`,
        })),
        "Validation Error",
        400,
      );
    }

    const {
      name,
      phone,
      email,
      password,
      state,
      stateId,
      city,
      cityId,
    } = req.body;
    const userSchemaPaths = User.schema.paths;
    const validationErrors = [];

    const stateName = String(state || "").trim();
    const cityName = String(city || "").trim();
    const parsedStateId = Number(stateId);
    const parsedCityId = Number(cityId);

    if (!stateName || !parsedStateId) {
      validationErrors.push({
        path: "state",
        msg: "Please select a state",
      });
    }
    if (!cityName || !parsedCityId) {
      validationErrors.push({
        path: "city",
        msg: "Please select a city",
      });
    }

    if (!name) {
      validationErrors.push({ path: "name", msg: "Name is required" });
    } else {
      const nameStr = String(name).trim();
      if (nameStr.length < userSchemaPaths.name.minlength) {
        validationErrors.push({
          path: "name",
          msg: `Name must be at least ${userSchemaPaths.name.minlength} characters`,
        });
      }
      if (nameStr.length > userSchemaPaths.name.maxlength) {
        validationErrors.push({
          path: "name",
          msg: `Name must be at most ${userSchemaPaths.name.maxlength} characters`,
        });
      }
      if (/<[^>]*>/g.test(nameStr)) {
        validationErrors.push({
          path: "name",
          msg: "Name cannot contain HTML or script tags",
        });
      }
      if (/\$[a-zA-Z]+/.test(nameStr)) {
        validationErrors.push({
          path: "name",
          msg: "Name contains invalid characters",
        });
      }
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      validationErrors.push({
        path: "phone",
        msg: phoneValidation.error,
      });
    }

    if (!password) {
      validationErrors.push({ path: "password", msg: "Password is required" });
    } else {
      const passwordStr = String(password);
      const minPasswordLength = userSchemaPaths.password?.minlength || 8;
      const maxPasswordLength = userSchemaPaths.password?.maxlength || 128;
      if (passwordStr.length < minPasswordLength) {
        validationErrors.push({
          path: "password",
          msg: `Password must be at least ${minPasswordLength} characters`,
        });
      }
      if (passwordStr.length > maxPasswordLength) {
        validationErrors.push({
          path: "password",
          msg: `Password must be at most ${maxPasswordLength} characters`,
        });
      }
    }

    let emailStr;
    if (!email) {
      validationErrors.push({ path: "email", msg: "Email is required" });
    } else {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        validationErrors.push({
          path: "email",
          msg: emailValidation.error,
        });
      } else {
        emailStr = emailValidation.sanitized;
      }
    }

    if (validationErrors.length > 0) {
      session.endSession();
      return response.errorResponse(
        res,
        validationErrors,
        "Validation Error",
        400,
      );
    }

    const phoneStr = phoneValidation.sanitized;

    await session.withTransaction(async () => {
      const existingPhone = await User.findOne({ phone: phoneStr }).session(
        session,
      );
      if (existingPhone) {
        throw new Error("Phone number already registered");
      }

      const existingEmail = await User.findOne({
        email: emailStr,
      }).session(session);
      if (existingEmail) {
        throw new Error("Email already registered");
      }

      const memberId = await generateMemberId(phoneStr, session);

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        memberId,
        name: toTitleCase(String(name)),
        phone: phoneStr,
        email: emailStr,
        password: hashedPassword,
        status: 1,
        uuid: uuidv4(),
        country: "India",
        countryId: 101,
        state: stateName,
        stateId: parsedStateId,
        city: cityName,
        cityId: parsedCityId,
      });

      await user.save({ session });
    });

    session.endSession();
    return response.successResponse(res, {}, "User created successfully");
  } catch (err) {
    session.endSession();
    console.error("Error creating user:", err);

    if (err.message === "Phone number already registered") {
      return response.errorResponse(
        res,
        [{ path: "phone", msg: "Phone number already registered" }],
        "Validation Error",
        400,
      );
    }

    if (err.message === "Email already registered") {
      return response.errorResponse(
        res,
        [{ path: "email", msg: "Email is already registered" }],
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
      const field = err.keyPattern?.email ? "email" : "phone";
      const sanitizedError = sanitizeDuplicateKeyError(err, field);
      return response.errorResponse(
        res,
        [sanitizedError],
        "Validation Error",
        400,
      );
    }

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((error) => ({
        path: error.path,
        msg: sanitizeError(error.message, "validation"),
      }));
      return response.errorResponse(res, errors, "Validation Error", 400);
    }

    return response.errorResponse(res, {}, "An error occurred", 500);
  }
};

/**
 * PUT /admin/users/:userId
 * Update user (admin power - can update all fields).
 *
 * Edit User form sends only profile fields per tab.
 * isVerified is accepted for other admin flows but is never submitted by the Edit User UI.
 */
const updateUserById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.errorResponse(
        res,
        sanitizeValidationErrors(errors.array()),
        "Validation Error",
        400,
      );
    }

    const userId = req.params.user_id || req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.errorResponse(
        res,
        { msg: "Invalid resource identifier" },
        "Invalid resource identifier",
        400,
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return response.errorResponse(
        res,
        { msg: "Resource not found" },
        "Resource not found",
        404,
      );
    }

    // Get allowed fields from schema
    const allowedUserFields = Object.keys(User.schema.paths).filter(
      (key) => !["_id", "__v", "createdAt", "updatedAt"].includes(key),
    );
    const allowedUserDetailsFields = Object.keys(
      UserDetails.schema.paths,
    ).filter(
      (key) =>
        !["_id", "__v", "createdAt", "updatedAt", "userId"].includes(key) &&
        !key.includes("."),
    );

    // Reject unknown fields
    const unknownFields = [];
    Object.keys(req.body).forEach((key) => {
      if (
        !allowedUserFields.includes(key) &&
        !allowedUserDetailsFields.includes(key) &&
        key !== "txn_password"
      ) {
        unknownFields.push(key);
      }
    });

    if (unknownFields.length > 0) {
      return response.errorResponse(
        res,
        unknownFields.map((field) => ({
          path: field,
          msg: `Field '${field}' is not allowed`,
        })),
        "Validation Error",
        400,
      );
    }

    const {
      name,
      phone,
      email,
      password,
      status,
      isVerified,
      country,
      countryId,
      state,
      stateId,
      city,
      cityId,
      address,
      // UserDetails fields
      dob,
      gender,
      height,
      weight,
    } = req.body;

    // Get schema paths for validation
    const userSchemaPaths = User.schema.paths;
    const userDetailsSchemaPaths = UserDetails.schema.paths;
    const validationErrors = [];

    let passwordChanged = false;

    // Update User fields
    const userUpdateFields = {};

    if (name !== undefined) {
      const nameStr = name ? String(name).trim() : "";
      if (nameStr) {
        if (nameStr.length < userSchemaPaths.name.minlength) {
          validationErrors.push({
            path: "name",
            msg: `Name must be at least ${userSchemaPaths.name.minlength} characters`,
          });
        } else if (nameStr.length > userSchemaPaths.name.maxlength) {
          validationErrors.push({
            path: "name",
            msg: `Name must be at most ${userSchemaPaths.name.maxlength} characters`,
          });
        } else {
          if (/<[^>]*>/g.test(nameStr)) {
            validationErrors.push({
              path: "name",
              msg: "Name cannot contain HTML or script tags",
            });
          } else if (/\$[a-zA-Z]+/.test(nameStr)) {
            validationErrors.push({
              path: "name",
              msg: "Name contains invalid characters",
            });
          } else {
            userUpdateFields.name = toTitleCase(nameStr);
          }
        }
      } else if (userSchemaPaths.name.isRequired) {
        validationErrors.push({ path: "name", msg: "Name is required" });
      }
    }

    if (email !== undefined) {
      const emailStr = email ? String(email).trim() : "";
      if (emailStr) {
        const emailValidation = validateEmail(emailStr);
        if (!emailValidation.valid) {
          validationErrors.push({
            path: "email",
            msg: emailValidation.error,
          });
        } else {
          const existingUser = await User.findOne({
            email: emailStr,
            _id: { $ne: userId },
          });
          if (existingUser) {
            validationErrors.push({
              path: "email",
              msg: "Email is already registered",
            });
          } else {
            userUpdateFields.email = emailValidation.sanitized;
          }
        }
      } else if (userSchemaPaths.email.isRequired) {
        validationErrors.push({ path: "email", msg: "Email is required" });
      }
    }

    if (status !== undefined) {
      const statusNum = parseInt(status);
      if (!userSchemaPaths.status.enumValues.includes(statusNum)) {
        validationErrors.push({
          path: "status",
          msg: `Status must be one of: ${userSchemaPaths.status.enumValues.join(", ")}`,
        });
      } else {
        userUpdateFields.status = statusNum;
      }
    }
    if (isVerified !== undefined)
      userUpdateFields.isVerified =
        isVerified === true || isVerified === "true";

    if (country !== undefined || countryId !== undefined) {
      userUpdateFields.country = String(country || "India").trim() || "India";
      userUpdateFields.countryId = Number(countryId) || 101;
    }

    if (state !== undefined || stateId !== undefined) {
      const stateName = String(state || "").trim();
      const parsedStateId = Number(stateId);
      if (!stateName || !parsedStateId) {
        validationErrors.push({
          path: "state",
          msg: "Please select a state",
        });
      } else {
        userUpdateFields.state = stateName;
        userUpdateFields.stateId = parsedStateId;
      }
    }

    if (city !== undefined || cityId !== undefined) {
      const cityName = String(city || "").trim();
      const parsedCityId = Number(cityId);
      if (!cityName || !parsedCityId) {
        validationErrors.push({
          path: "city",
          msg: "Please select a city",
        });
      } else {
        userUpdateFields.city = cityName;
        userUpdateFields.cityId = parsedCityId;
      }
    }

    if (address !== undefined) {
      const addressStr = String(address || "").trim();
      if (addressStr.length > 500) {
        validationErrors.push({
          path: "address",
          msg: "Address must be at most 500 characters",
        });
      } else {
        userUpdateFields.address = addressStr;
      }
    }

    if (validationErrors.length > 0) {
      return response.errorResponse(
        res,
        validationErrors,
        "Validation Error",
        400,
      );
    }

    // Handle phone change (Member ID is independent and immutable)
    if (phone !== undefined && phone !== user.phone) {
      const phoneStr = String(phone).trim();
      if (!phoneStr || phoneStr.length === 0) {
        return response.errorResponse(
          res,
          [{ path: "phone", msg: "Phone number is required" }],
          "Validation Error",
          400,
        );
      }
      if (!/^\d+$/.test(phoneStr)) {
        return response.errorResponse(
          res,
          [{ path: "phone", msg: "Phone number must contain only digits" }],
          "Validation Error",
          400,
        );
      }

      // Check if new phone already exists
      const existingUser = await User.findOne({
        phone: phoneStr,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return response.errorResponse(
          res,
          [{ path: "phone", msg: "Phone number already registered" }],
          "Validation Error",
          400,
        );
      }

      userUpdateFields.phone = phoneStr;
    }

    // Handle password change
    if (password !== undefined && password !== "") {
      const passwordStr = String(password);
      const minPasswordLength = userSchemaPaths.password?.minlength || 8;
      const maxPasswordLength = userSchemaPaths.password?.maxlength || 128;
      if (passwordStr.length < minPasswordLength) {
        validationErrors.push({
          path: "password",
          msg: `Password must be at least ${minPasswordLength} characters`,
        });
      } else if (passwordStr.length > maxPasswordLength) {
        validationErrors.push({
          path: "password",
          msg: `Password must be at most ${maxPasswordLength} characters`,
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        userUpdateFields.password = await bcrypt.hash(password, salt);
        userUpdateFields.passwordChangedAt = new Date();
        passwordChanged = true;
      }
    }

    // Check validation errors after password validation
    if (validationErrors.length > 0) {
      return response.errorResponse(
        res,
        validationErrors,
        "Validation Error",
        400,
      );
    }

    // Update user
    if (Object.keys(userUpdateFields).length > 0) {
      await User.findByIdAndUpdate(
        userId,
        { $set: userUpdateFields },
        { returnDocument: "after" },
      );
    }

    // Update or create UserDetails
    const userDetailsData = {};
    const userDetailsValidationErrors = [];

    if (dob !== undefined) {
      if (dob) {
        const dobDate = new Date(dob);
        if (isNaN(dobDate.getTime())) {
          userDetailsValidationErrors.push({
            path: "dob",
            msg: "Date of birth must be a valid date",
          });
        } else {
          userDetailsData.dob = dobDate;
        }
      } else if (userDetailsSchemaPaths.dob.isRequired) {
        userDetailsValidationErrors.push({
          path: "dob",
          msg: "Date of birth is required",
        });
      }
    }

    if (gender !== undefined) {
      if (gender) {
        if (!userDetailsSchemaPaths.gender.enumValues.includes(gender)) {
          userDetailsValidationErrors.push({
            path: "gender",
            msg: `Gender must be one of: ${userDetailsSchemaPaths.gender.enumValues.join(", ")}`,
          });
        } else {
          userDetailsData.gender = gender;
        }
      } else if (userDetailsSchemaPaths.gender.isRequired) {
        userDetailsValidationErrors.push({
          path: "gender",
          msg: "Gender is required",
        });
      }
    }

    if (height !== undefined && height !== "" && height !== null) {
      const heightNum = Number(height);
      if (Number.isNaN(heightNum)) {
        userDetailsValidationErrors.push({
          path: "height",
          msg: "Height must be a valid number",
        });
      } else {
        const heightPath = userDetailsSchemaPaths.height;
        if (heightPath.min !== undefined && heightNum < heightPath.min) {
          userDetailsValidationErrors.push({
            path: "height",
            msg: `Height must be at least ${heightPath.min}`,
          });
        } else if (heightPath.max !== undefined && heightNum > heightPath.max) {
          userDetailsValidationErrors.push({
            path: "height",
            msg: `Height must be at most ${heightPath.max}`,
          });
        } else {
          userDetailsData.height = heightNum;
        }
      }
    }

    if (weight !== undefined && weight !== "" && weight !== null) {
      const weightNum = Number(weight);
      if (Number.isNaN(weightNum)) {
        userDetailsValidationErrors.push({
          path: "weight",
          msg: "Weight must be a valid number",
        });
      } else {
        const weightPath = userDetailsSchemaPaths.weight;
        if (weightPath.min !== undefined && weightNum < weightPath.min) {
          userDetailsValidationErrors.push({
            path: "weight",
            msg: `Weight must be at least ${weightPath.min}`,
          });
        } else if (weightPath.max !== undefined && weightNum > weightPath.max) {
          userDetailsValidationErrors.push({
            path: "weight",
            msg: `Weight must be at most ${weightPath.max}`,
          });
        } else {
          userDetailsData.weight = weightNum;
        }
      }
    }

    if (userDetailsValidationErrors.length > 0) {
      return response.errorResponse(
        res,
        userDetailsValidationErrors,
        "Validation Error",
        400,
      );
    }

    if (Object.keys(userDetailsData).length > 0) {
      const updateOp = {
        $set: userDetailsData,
      };
      await UserDetails.findOneAndUpdate(
        { userId },
        updateOp,
        { returnDocument: "after", upsert: true, runValidators: true },
      );
    }

    // Invalidate all sessions if password was changed
    if (passwordChanged) {
      await Session.deleteMany({ userID: userId });
    }

    const userData = await fetchAdminEditUserById(userId);
    return response.successResponse(res, userData, "User updated successfully");
  } catch (err) {
    console.error("Error updating user:", err);

    if (err.message && err.message.includes("Maximum number of users")) {
      console.error("Update user error details:", err);
      return response.errorResponse(
        res,
        [
          {
            path: "phone",
            msg: "Operation limit reached. Please contact support.",
          },
        ],
        "Validation Error",
        400,
      );
    }

    if (err.code === 11000) {
      const sanitizedError = sanitizeDuplicateKeyError(err, "phone");
      return response.errorResponse(
        res,
        [sanitizedError],
        "Validation Error",
        400,
      );
    }

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((error) => ({
        path: error.path,
        msg: sanitizeError(error.message, "validation"),
      }));
      return response.errorResponse(res, errors, "Validation Error", 400);
    }

    console.error("Update user error:", err);
    const errorMessage = sanitizeError(err, "generic");
    return response.errorResponse(
      res,
      [{ msg: errorMessage }],
      errorMessage,
      400,
    );
  }
};

/**
 * DELETE /admin/users/:userId
 * Delete user and associated UserDetails
 */
const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.user_id || req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.errorResponse(
        res,
        { msg: "Invalid resource identifier" },
        "Invalid resource identifier",
        400,
      );
    }

    // Delete UserDetails first (to avoid constraint issues)
    await UserDetails.deleteOne({ userId });

    // Delete all user sessions
    await Session.deleteMany({ userID: userId });

    // Delete User
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return response.errorResponse(
        res,
        { msg: "Resource not found" },
        "Resource not found",
        404,
      );
    }

    return response.successResponse(res, {}, "User deleted successfully");
  } catch (err) {
    console.error("Error deleting user:", err);

    if (err.kind === "ObjectId" || err.message === "User not found") {
      return response.errorResponse(
        res,
        { msg: "Resource not found" },
        "Resource not found",
        404,
      );
    }

    console.error("Delete user error:", err);
    return response.errorResponse(res, {}, "An error occurred", 500);
  }
};

/**
 * POST /admin/users/:user_id/block
 * Block user account and clear sessions.
 */
const blockUser = async (req, res) => {
  try {
    const userId = req.params.user_id || req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.errorResponse(
        res,
        { msg: "Invalid user id" },
        "Invalid user id",
        400,
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return response.errorResponse(res, {}, "User not found", 404);
    }

    if (user.status === 3) {
      return response.errorResponse(res, {}, "User is already blocked", 400);
    }

    user.status = 3;
    await user.save();
    await Session.deleteMany({ userID: userId });

    return response.successResponse(
      res,
      {
        _id: user._id,
        memberId: user.memberId,
        name: user.name,
        status: user.status,
      },
      "User blocked successfully",
    );
  } catch (error) {
    console.error("Error blocking user:", error);
    return response.errorResponse(
      res,
      [{ msg: error.message || "Failed to block user" }],
      error.message || "Failed to block user",
      400,
    );
  }
};

/**
 * POST /admin/users/:user_id/unblock
 * Restore blocked user to Active.
 */
const unblockUser = async (req, res) => {
  try {
    const userId = req.params.user_id || req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.errorResponse(
        res,
        { msg: "Invalid user id" },
        "Invalid user id",
        400,
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return response.errorResponse(res, {}, "User not found", 404);
    }

    if (user.status !== 3) {
      return response.errorResponse(res, {}, "User is not blocked", 400);
    }

    user.status = 1;
    await user.save();

    return response.successResponse(
      res,
      {
        _id: user._id,
        memberId: user.memberId,
        name: user.name,
        status: user.status,
      },
      "User unblocked successfully",
    );
  } catch (error) {
    console.error("Error unblocking user:", error);
    return response.errorResponse(
      res,
      [{ msg: error.message || "Failed to unblock user" }],
      error.message || "Failed to unblock user",
      400,
    );
  }
};

module.exports = {
  getUsersList,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
  blockUser,
  unblockUser,
};
