const mongoose = require("mongoose");
const response = require("../../../config/response");
const Team = require("../../../models/Team");
const TeamGroup = require("../../../models/TeamGroup");
const { uploadToR2, deleteFromR2 } = require("../../../infra/storage/r2Helper");
const {
  createCmsSectionSettingsHandlers,
} = require("../../../shared/utils/cmsSectionSettingsHelpers");

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined) {
    return defaultValue;
  }
  return value === "true" || value === true;
};

const getNextTeamOrder = async (groupId) => {
  const filter = groupId ? { group: groupId } : {};
  const maxTeam = await Team.findOne(filter)
    .sort({ order: -1 })
    .select("order")
    .lean();
  return (maxTeam?.order ?? 0) + 1;
};

const getNextGroupOrder = async () => {
  const maxGroup = await TeamGroup.findOne()
    .sort({ order: -1 })
    .select("order")
    .lean();
  return (maxGroup?.order ?? 0) + 1;
};

const shiftTeamOrdersForInsert = async (groupId, targetOrder, excludeId = null) => {
  const filter = { group: groupId, order: { $gte: targetOrder } };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  await Team.updateMany(filter, { $inc: { order: 1 } });
};

const applyTeamOrderChange = async (teamId, groupId, oldOrder, newOrder) => {
  if (oldOrder === newOrder) {
    return;
  }

  if (newOrder < oldOrder) {
    await Team.updateMany(
      {
        _id: { $ne: teamId },
        group: groupId,
        order: { $gte: newOrder, $lt: oldOrder },
      },
      { $inc: { order: 1 } },
    );
  } else {
    await Team.updateMany(
      {
        _id: { $ne: teamId },
        group: groupId,
        order: { $gt: oldOrder, $lte: newOrder },
      },
      { $inc: { order: -1 } },
    );
  }
};

const shiftTeamOrdersAfterDelete = async (groupId, deletedOrder) => {
  await Team.updateMany(
    { group: groupId, order: { $gt: deletedOrder } },
    { $inc: { order: -1 } },
  );
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @route POST /api/admin/teams
 */
const createTeam = async (req, res) => {
  let uploadedKey = null;

  try {
    const { name, group, order, isActive } = req.body;

    if (!name || !String(name).trim()) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "Team name is required" }],
        "Team name is required",
        400,
      );
    }

    if (!group || !isValidObjectId(group)) {
      return response.errorResponse(
        res,
        [{ path: "group", msg: "Team group is required" }],
        "Team group is required",
        400,
      );
    }

    const teamGroup = await TeamGroup.findById(group).lean();
    if (!teamGroup) {
      return response.errorResponse(
        res,
        [{ path: "group", msg: "Team group not found" }],
        "Team group not found",
        400,
      );
    }

    if (!req.file) {
      return response.errorResponse(
        res,
        [{ path: "image", msg: "Team logo is required" }],
        "Team logo is required",
        400,
      );
    }

    const uploadResult = await uploadToR2(req.file, "teams");
    uploadedKey = uploadResult.key;

    let targetOrder;
    if (order !== undefined && order !== "" && order !== null) {
      targetOrder = Math.max(1, parseInt(order, 10) || 1);
      await shiftTeamOrdersForInsert(group, targetOrder);
    } else {
      targetOrder = await getNextTeamOrder(group);
    }

    const team = new Team({
      name: String(name).trim(),
      logoUrl: uploadResult.url,
      logoKey: uploadResult.key,
      group,
      order: targetOrder,
      isActive: parseBoolean(isActive),
    });

    await team.save();
    await team.populate("group", "name order isActive");

    return response.successResponse(res, team, "Team created successfully");
  } catch (error) {
    console.error("Error creating team:", error);

    if (uploadedKey) {
      try {
        await deleteFromR2(uploadedKey);
      } catch (cleanupError) {
        console.error("Error cleaning up R2 file:", cleanupError);
      }
    }

    return response.errorResponse(
      res,
      {},
      error.message || "Failed to create team",
      500,
    );
  }
};

/**
 * @route GET /api/admin/teams
 */
const getTeams = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      orderBy = "order",
      ascending = "asc",
      group,
    } = req.query;

    const pageSize = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = pageSize * (Math.max(parseInt(page, 10) || 1, 1) - 1);
    const sortOrder = ascending === "desc" ? -1 : 1;
    const allowedOrderBy = ["order", "name", "createdAt", "isActive"];
    const sortField = allowedOrderBy.includes(orderBy) ? orderBy : "order";

    const query = {};
    if (group && isValidObjectId(group)) {
      query.group = group;
    }

    const [data, totalRecord, nextOrder] = await Promise.all([
      Team.find(query)
        .populate("group", "name order isActive")
        .sort({ [sortField]: sortOrder, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Team.countDocuments(query),
      getNextTeamOrder(query.group),
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
              nextOrder,
            },
          ],
          data,
        },
      ],
      "Teams fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching teams:", error);
    return response.errorResponse(res, {}, "Failed to fetch teams", 500);
  }
};

/**
 * @route PUT /api/admin/teams/:id
 */
const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, group, order, isActive, clearImage } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return response.errorResponse(res, {}, "Team not found", 404);
    }

    const shouldClearImage = clearImage === true || clearImage === "true";

    if (req.file) {
      try {
        const uploadResult = await uploadToR2(req.file, "teams");

        if (team.logoKey) {
          try {
            await deleteFromR2(team.logoKey);
          } catch (deleteError) {
            console.error("Error deleting old logo from R2:", deleteError);
          }
        }

        team.logoUrl = uploadResult.url;
        team.logoKey = uploadResult.key;
      } catch (uploadError) {
        return response.errorResponse(
          res,
          {},
          `Failed to upload logo: ${uploadError.message}`,
          500,
        );
      }
    } else if (shouldClearImage) {
      if (team.logoKey) {
        try {
          await deleteFromR2(team.logoKey);
        } catch (deleteError) {
          console.error("Error deleting logo from R2:", deleteError);
        }
      }
      team.logoUrl = "";
      team.logoKey = "";
    }

    if (!team.logoUrl || !team.logoKey) {
      return response.errorResponse(
        res,
        [{ path: "image", msg: "Team logo is required" }],
        "Team logo is required",
        400,
      );
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return response.errorResponse(
          res,
          [{ path: "name", msg: "Team name is required" }],
          "Team name is required",
          400,
        );
      }
      team.name = trimmed;
    }

    const oldGroupId = String(team.group);
    let nextGroupId = oldGroupId;

    if (group !== undefined && group !== "") {
      if (!isValidObjectId(group)) {
        return response.errorResponse(
          res,
          [{ path: "group", msg: "Invalid team group" }],
          "Invalid team group",
          400,
        );
      }

      const teamGroup = await TeamGroup.findById(group).lean();
      if (!teamGroup) {
        return response.errorResponse(
          res,
          [{ path: "group", msg: "Team group not found" }],
          "Team group not found",
          400,
        );
      }

      nextGroupId = String(group);
      team.group = group;
    }

    const groupChanged = nextGroupId !== oldGroupId;

    if (groupChanged) {
      await shiftTeamOrdersAfterDelete(oldGroupId, team.order);
      let targetOrder;
      if (order !== undefined && order !== "") {
        targetOrder = Math.max(1, parseInt(order, 10) || 1);
      } else {
        targetOrder = await getNextTeamOrder(nextGroupId);
      }
      await shiftTeamOrdersForInsert(nextGroupId, targetOrder, id);
      team.order = targetOrder;
    } else if (order !== undefined && order !== "") {
      const newOrder = Math.max(1, parseInt(order, 10) || 1);
      const oldOrder = team.order;
      if (newOrder !== oldOrder) {
        await applyTeamOrderChange(id, nextGroupId, oldOrder, newOrder);
        team.order = newOrder;
      }
    }

    if (isActive !== undefined) {
      team.isActive = parseBoolean(isActive, team.isActive);
    }

    await team.save();
    await team.populate("group", "name order isActive");

    return response.successResponse(res, team, "Team updated successfully");
  } catch (error) {
    console.error("Error updating team:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to update team",
      500,
    );
  }
};

/**
 * @route DELETE /api/admin/teams/:id
 */
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);

    if (!team) {
      return response.errorResponse(res, {}, "Team not found", 404);
    }

    const deletedOrder = team.order;
    const groupId = team.group;

    if (team.logoKey) {
      try {
        await deleteFromR2(team.logoKey);
      } catch (deleteError) {
        console.error("Error deleting logo from R2:", deleteError);
      }
    }

    await Team.findByIdAndDelete(id);
    await shiftTeamOrdersAfterDelete(groupId, deletedOrder);

    return response.successResponse(res, {}, "Team deleted successfully");
  } catch (error) {
    console.error("Error deleting team:", error);
    return response.errorResponse(res, {}, "Failed to delete team", 500);
  }
};

/**
 * @route GET /api/admin/teams/groups
 */
const getTeamGroups = async (req, res) => {
  try {
    const groups = await TeamGroup.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const groupIds = groups.map((g) => g._id);
    const teamCounts = await Team.aggregate([
      { $match: { group: { $in: groupIds } } },
      { $group: { _id: "$group", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(
      teamCounts.map((item) => [String(item._id), item.count]),
    );

    const data = groups.map((group) => ({
      ...group,
      teamCount: countMap[String(group._id)] || 0,
    }));

    return response.successResponse(
      res,
      {
        data,
        nextOrder: await getNextGroupOrder(),
      },
      "Team groups fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching team groups:", error);
    return response.errorResponse(res, {}, "Failed to fetch team groups", 500);
  }
};

/**
 * @route POST /api/admin/teams/groups
 */
const createTeamGroup = async (req, res) => {
  try {
    const { name, order, isActive } = req.body;

    if (!name || !String(name).trim()) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "Group name is required" }],
        "Group name is required",
        400,
      );
    }

    const trimmedName = String(name).trim();
    const existing = await TeamGroup.findOne({
      name: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    }).lean();

    if (existing) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "A group with this name already exists" }],
        "A group with this name already exists",
        400,
      );
    }

    let targetOrder;
    if (order !== undefined && order !== "" && order !== null) {
      targetOrder = Math.max(1, parseInt(order, 10) || 1);
      await TeamGroup.updateMany(
        { order: { $gte: targetOrder } },
        { $inc: { order: 1 } },
      );
    } else {
      targetOrder = await getNextGroupOrder();
    }

    const group = new TeamGroup({
      name: trimmedName,
      order: targetOrder,
      isActive: parseBoolean(isActive),
    });

    await group.save();

    return response.successResponse(
      res,
      { ...group.toObject(), teamCount: 0 },
      "Team group created successfully",
    );
  } catch (error) {
    console.error("Error creating team group:", error);
    if (error?.code === 11000) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "A group with this name already exists" }],
        "A group with this name already exists",
        400,
      );
    }
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to create team group",
      500,
    );
  }
};

/**
 * @route PUT /api/admin/teams/groups/:id
 */
const updateTeamGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order, isActive } = req.body;

    const group = await TeamGroup.findById(id);
    if (!group) {
      return response.errorResponse(res, {}, "Team group not found", 404);
    }

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return response.errorResponse(
          res,
          [{ path: "name", msg: "Group name is required" }],
          "Group name is required",
          400,
        );
      }

      const existing = await TeamGroup.findOne({
        _id: { $ne: id },
        name: new RegExp(
          `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      }).lean();

      if (existing) {
        return response.errorResponse(
          res,
          [{ path: "name", msg: "A group with this name already exists" }],
          "A group with this name already exists",
          400,
        );
      }

      group.name = trimmedName;
    }

    if (order !== undefined && order !== "") {
      const newOrder = Math.max(1, parseInt(order, 10) || 1);
      const oldOrder = group.order;
      if (newOrder !== oldOrder) {
        if (newOrder < oldOrder) {
          await TeamGroup.updateMany(
            { _id: { $ne: id }, order: { $gte: newOrder, $lt: oldOrder } },
            { $inc: { order: 1 } },
          );
        } else {
          await TeamGroup.updateMany(
            { _id: { $ne: id }, order: { $gt: oldOrder, $lte: newOrder } },
            { $inc: { order: -1 } },
          );
        }
        group.order = newOrder;
      }
    }

    if (isActive !== undefined) {
      group.isActive = parseBoolean(isActive, group.isActive);
    }

    await group.save();
    const teamCount = await Team.countDocuments({ group: id });

    return response.successResponse(
      res,
      { ...group.toObject(), teamCount },
      "Team group updated successfully",
    );
  } catch (error) {
    console.error("Error updating team group:", error);
    if (error?.code === 11000) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "A group with this name already exists" }],
        "A group with this name already exists",
        400,
      );
    }
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to update team group",
      500,
    );
  }
};

/**
 * @route DELETE /api/admin/teams/groups/:id
 */
const deleteTeamGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await TeamGroup.findById(id);

    if (!group) {
      return response.errorResponse(res, {}, "Team group not found", 404);
    }

    const teamCount = await Team.countDocuments({ group: id });
    if (teamCount > 0) {
      return response.errorResponse(
        res,
        {},
        `Cannot delete group with ${teamCount} team(s). Move or delete teams first.`,
        400,
      );
    }

    const deletedOrder = group.order;
    await TeamGroup.findByIdAndDelete(id);
    await TeamGroup.updateMany(
      { order: { $gt: deletedOrder } },
      { $inc: { order: -1 } },
    );

    return response.successResponse(res, {}, "Team group deleted successfully");
  } catch (error) {
    console.error("Error deleting team group:", error);
    return response.errorResponse(res, {}, "Failed to delete team group", 500);
  }
};

/**
 * @route GET /api/common/teams
 */
const getPublicTeams = async (req, res) => {
  try {
    const groups = await TeamGroup.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("name order")
      .lean();

    const groupIds = groups.map((g) => g._id);
    const teams = await Team.find({
      isActive: true,
      group: { $in: groupIds },
    })
      .sort({ order: 1, createdAt: -1 })
      .select("name logoUrl order group")
      .lean();

    const teamsByGroup = teams.reduce((acc, team) => {
      const key = String(team.group);
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        _id: team._id,
        name: team.name,
        logoUrl: team.logoUrl,
        order: team.order,
      });
      return acc;
    }, {});

    const data = groups
      .map((group) => ({
        _id: group._id,
        name: group.name,
        order: group.order,
        teams: teamsByGroup[String(group._id)] || [],
      }))
      .filter((group) => group.teams.length > 0);

    return response.successResponse(
      res,
      data,
      "Active teams fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching public teams:", error);
    return response.errorResponse(res, {}, "Failed to fetch teams", 500);
  }
};

const {
  getSettings: getTeamSettings,
  updateSettings: updateTeamSettings,
  getPublicSettings: getPublicTeamSettings,
} = createCmsSectionSettingsHandlers({
  fieldKey: "teams",
  label: "Teams",
});

module.exports = {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam,
  getTeamGroups,
  createTeamGroup,
  updateTeamGroup,
  deleteTeamGroup,
  getTeamSettings,
  updateTeamSettings,
  getPublicTeams,
  getPublicTeamSettings,
};
