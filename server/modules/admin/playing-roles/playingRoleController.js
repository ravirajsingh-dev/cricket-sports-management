const response = require("../../../config/response");
const PlayingRole = require("../../../models/PlayingRole");
const { toTitleCase } = require("../../../shared/utils/inputValidation");

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined) {
    return defaultValue;
  }
  return value === "true" || value === true;
};

const parseAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return Math.round(amount * 100) / 100;
};

/**
 * @route POST /api/admin/playing-roles
 */
const createPlayingRole = async (req, res) => {
  try {
    const { name, amount, isActive } = req.body;

    if (!name || !String(name).trim()) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "Name is required" }],
        "Name is required",
        400,
      );
    }

    const parsedAmount = parseAmount(amount);
    if (parsedAmount === null) {
      return response.errorResponse(
        res,
        [{ path: "amount", msg: "Valid amount is required" }],
        "Valid amount is required",
        400,
      );
    }

    const playingRole = await PlayingRole.create({
      name: toTitleCase(String(name).trim()).slice(0, 100),
      amount: parsedAmount,
      isActive: parseBoolean(isActive),
    });

    return response.successResponse(
      res,
      playingRole,
      "Playing role created successfully",
    );
  } catch (error) {
    console.error("Error creating playing role:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to create playing role",
      500,
    );
  }
};

/**
 * @route GET /api/admin/playing-roles
 */
const getPlayingRoles = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      orderBy = "createdAt",
      ascending = "desc",
    } = req.query;

    const pageSize = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = pageSize * (Math.max(parseInt(page, 10) || 1, 1) - 1);
    const sortOrder = ascending === "asc" ? 1 : -1;
    const allowedOrderBy = ["createdAt", "name", "amount", "isActive"];
    const sortField = allowedOrderBy.includes(orderBy) ? orderBy : "createdAt";

    const [data, totalRecord] = await Promise.all([
      PlayingRole.find({})
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      PlayingRole.countDocuments({}),
    ]);

    return response.successResponse(
      res,
      [
        {
          metadata: [
            {
              totalRecord,
              current_page: parseInt(page, 10) || 1,
              per_page: pageSize,
            },
          ],
          data,
        },
      ],
      "Playing roles fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching playing roles:", error);
    return response.errorResponse(res, {}, "Failed to fetch playing roles", 500);
  }
};

/**
 * @route PUT /api/admin/playing-roles/:id
 */
const updatePlayingRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, isActive } = req.body;

    const playingRole = await PlayingRole.findById(id);
    if (!playingRole) {
      return response.errorResponse(res, {}, "Playing role not found", 404);
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return response.errorResponse(
          res,
          [{ path: "name", msg: "Name is required" }],
          "Name is required",
          400,
        );
      }
      playingRole.name = toTitleCase(trimmed).slice(0, 100);
    }

    if (amount !== undefined && amount !== "") {
      const parsedAmount = parseAmount(amount);
      if (parsedAmount === null) {
        return response.errorResponse(
          res,
          [{ path: "amount", msg: "Valid amount is required" }],
          "Valid amount is required",
          400,
        );
      }
      playingRole.amount = parsedAmount;
    }

    if (isActive !== undefined) {
      playingRole.isActive = parseBoolean(isActive, playingRole.isActive);
    }

    await playingRole.save();

    return response.successResponse(
      res,
      playingRole,
      "Playing role updated successfully",
    );
  } catch (error) {
    console.error("Error updating playing role:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to update playing role",
      500,
    );
  }
};

/**
 * @route DELETE /api/admin/playing-roles/:id
 */
const deletePlayingRole = async (req, res) => {
  try {
    const { id } = req.params;
    const playingRole = await PlayingRole.findById(id);

    if (!playingRole) {
      return response.errorResponse(res, {}, "Playing role not found", 404);
    }

    await PlayingRole.findByIdAndDelete(id);

    return response.successResponse(res, {}, "Playing role deleted successfully");
  } catch (error) {
    console.error("Error deleting playing role:", error);
    return response.errorResponse(res, {}, "Failed to delete playing role", 500);
  }
};

/**
 * @route GET /api/common/playing-roles
 */
const getPublicPlayingRoles = async (req, res) => {
  try {
    const roles = await PlayingRole.find({ isActive: true })
      .sort({ amount: 1, name: 1 })
      .select("name amount")
      .lean();

    return response.successResponse(
      res,
      roles,
      "Active playing roles fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching public playing roles:", error);
    return response.errorResponse(res, {}, "Failed to fetch playing roles", 500);
  }
};

module.exports = {
  createPlayingRole,
  getPlayingRoles,
  updatePlayingRole,
  deletePlayingRole,
  getPublicPlayingRoles,
};
