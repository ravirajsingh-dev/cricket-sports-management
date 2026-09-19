const mongoose = require("mongoose");
const response = require("../../../config/response");
const CarouselItem = require("../../../models/CarouselItem");
const CarouselGroup = require("../../../models/CarouselGroup");
const { uploadToR2, deleteFromR2 } = require("../../../infra/storage/r2Helper");

const SHORT_DESC_MAX_LENGTH = CarouselItem.SHORT_DESC_MAX_LENGTH || 80;
const NAME_MAX_LENGTH = CarouselItem.NAME_MAX_LENGTH || 50;

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined) {
    return defaultValue;
  }
  return value === "true" || value === true;
};

const normalizeDirection = (value) =>
  value === "rtl" ? "rtl" : "ltr";

const getNextItemOrder = async (groupId) => {
  const filter = groupId ? { group: groupId } : {};
  const maxItem = await CarouselItem.findOne(filter)
    .sort({ order: -1 })
    .select("order")
    .lean();
  return (maxItem?.order ?? 0) + 1;
};

const getNextGroupOrder = async () => {
  const maxGroup = await CarouselGroup.findOne()
    .sort({ order: -1 })
    .select("order")
    .lean();
  return (maxGroup?.order ?? 0) + 1;
};

const shiftItemOrdersForInsert = async (groupId, targetOrder, excludeId = null) => {
  const filter = { group: groupId, order: { $gte: targetOrder } };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  await CarouselItem.updateMany(filter, { $inc: { order: 1 } });
};

const applyItemOrderChange = async (itemId, groupId, oldOrder, newOrder) => {
  if (oldOrder === newOrder) {
    return;
  }

  if (newOrder < oldOrder) {
    await CarouselItem.updateMany(
      {
        _id: { $ne: itemId },
        group: groupId,
        order: { $gte: newOrder, $lt: oldOrder },
      },
      { $inc: { order: 1 } },
    );
  } else {
    await CarouselItem.updateMany(
      {
        _id: { $ne: itemId },
        group: groupId,
        order: { $gt: oldOrder, $lte: newOrder },
      },
      { $inc: { order: -1 } },
    );
  }
};

const shiftItemOrdersAfterDelete = async (groupId, deletedOrder) => {
  await CarouselItem.updateMany(
    { group: groupId, order: { $gt: deletedOrder } },
    { $inc: { order: -1 } },
  );
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @route POST /api/admin/carousel-sections
 */
const createCarouselItem = async (req, res) => {
  let uploadedKey = null;

  try {
    const { name, shortDesc, group, order, isActive } = req.body;

    if (!group || !isValidObjectId(group)) {
      return response.errorResponse(
        res,
        [{ path: "group", msg: "Section group is required" }],
        "Section group is required",
        400,
      );
    }

    const carouselGroup = await CarouselGroup.findById(group).lean();
    if (!carouselGroup) {
      return response.errorResponse(
        res,
        [{ path: "group", msg: "Section group not found" }],
        "Section group not found",
        400,
      );
    }

    const trimmedName = name ? String(name).trim() : "";
    const trimmedShortDesc = shortDesc ? String(shortDesc).trim() : "";

    if (trimmedName.length > NAME_MAX_LENGTH) {
      return response.errorResponse(
        res,
        [
          {
            path: "name",
            msg: `Name must be at most ${NAME_MAX_LENGTH} characters`,
          },
        ],
        `Name must be at most ${NAME_MAX_LENGTH} characters`,
        400,
      );
    }

    if (trimmedShortDesc.length > SHORT_DESC_MAX_LENGTH) {
      return response.errorResponse(
        res,
        [
          {
            path: "shortDesc",
            msg: `Short description must be at most ${SHORT_DESC_MAX_LENGTH} characters`,
          },
        ],
        `Short description must be at most ${SHORT_DESC_MAX_LENGTH} characters`,
        400,
      );
    }

    if (!trimmedName && !trimmedShortDesc && !req.file) {
      return response.errorResponse(
        res,
        [
          {
            path: "name",
            msg: "Add at least one of: name, short description, or image",
          },
        ],
        "Add at least one of: name, short description, or image",
        400,
      );
    }

    let imageUrl = "";
    let imageKey = "";

    if (req.file) {
      const uploadResult = await uploadToR2(req.file, "carousel-sections");
      uploadedKey = uploadResult.key;
      imageUrl = uploadResult.url;
      imageKey = uploadResult.key;
    }

    let targetOrder;
    if (order !== undefined && order !== "" && order !== null) {
      targetOrder = Math.max(1, parseInt(order, 10) || 1);
      await shiftItemOrdersForInsert(group, targetOrder);
    } else {
      targetOrder = await getNextItemOrder(group);
    }

    const item = new CarouselItem({
      name: trimmedName,
      shortDesc: trimmedShortDesc,
      imageUrl,
      imageKey,
      group,
      order: targetOrder,
      isActive: parseBoolean(isActive),
    });

    await item.save();
    await item.populate("group", "name direction order isActive");

    return response.successResponse(
      res,
      item,
      "Carousel item created successfully",
    );
  } catch (error) {
    console.error("Error creating carousel item:", error);

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
      error.message || "Failed to create carousel item",
      500,
    );
  }
};

/**
 * @route GET /api/admin/carousel-sections
 */
const getCarouselItems = async (req, res) => {
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
      CarouselItem.find(query)
        .populate("group", "name direction order isActive")
        .sort({ [sortField]: sortOrder, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      CarouselItem.countDocuments(query),
      getNextItemOrder(query.group),
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
      "Carousel items fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching carousel items:", error);
    return response.errorResponse(
      res,
      {},
      "Failed to fetch carousel items",
      500,
    );
  }
};

/**
 * @route PUT /api/admin/carousel-sections/:id
 */
const updateCarouselItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, shortDesc, group, order, isActive, clearImage } =
      req.body;

    const item = await CarouselItem.findById(id);
    if (!item) {
      return response.errorResponse(res, {}, "Carousel item not found", 404);
    }

    const shouldClearImage = clearImage === true || clearImage === "true";

    if (req.file) {
      try {
        const uploadResult = await uploadToR2(req.file, "carousel-sections");

        if (item.imageKey) {
          try {
            await deleteFromR2(item.imageKey);
          } catch (deleteError) {
            console.error("Error deleting old image from R2:", deleteError);
          }
        }

        item.imageUrl = uploadResult.url;
        item.imageKey = uploadResult.key;
      } catch (uploadError) {
        return response.errorResponse(
          res,
          {},
          `Failed to upload image: ${uploadError.message}`,
          500,
        );
      }
    } else if (shouldClearImage) {
      if (item.imageKey) {
        try {
          await deleteFromR2(item.imageKey);
        } catch (deleteError) {
          console.error("Error deleting image from R2:", deleteError);
        }
      }
      item.imageUrl = "";
      item.imageKey = "";
    }

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length > NAME_MAX_LENGTH) {
        return response.errorResponse(
          res,
          [
            {
              path: "name",
              msg: `Name must be at most ${NAME_MAX_LENGTH} characters`,
            },
          ],
          `Name must be at most ${NAME_MAX_LENGTH} characters`,
          400,
        );
      }
      item.name = trimmedName;
    }
    if (shortDesc !== undefined) {
      const trimmedShortDesc = String(shortDesc).trim();
      if (trimmedShortDesc.length > SHORT_DESC_MAX_LENGTH) {
        return response.errorResponse(
          res,
          [
            {
              path: "shortDesc",
              msg: `Short description must be at most ${SHORT_DESC_MAX_LENGTH} characters`,
            },
          ],
          `Short description must be at most ${SHORT_DESC_MAX_LENGTH} characters`,
          400,
        );
      }
      item.shortDesc = trimmedShortDesc;
    }

    if (!item.name && !item.shortDesc && !item.imageUrl) {
      return response.errorResponse(
        res,
        [
          {
            path: "name",
            msg: "Add at least one of: name, short description, or image",
          },
        ],
        "Add at least one of: name, short description, or image",
        400,
      );
    }

    const oldGroupId = String(item.group);
    let nextGroupId = oldGroupId;

    if (group !== undefined && group !== "") {
      if (!isValidObjectId(group)) {
        return response.errorResponse(
          res,
          [{ path: "group", msg: "Invalid section group" }],
          "Invalid section group",
          400,
        );
      }

      const carouselGroup = await CarouselGroup.findById(group).lean();
      if (!carouselGroup) {
        return response.errorResponse(
          res,
          [{ path: "group", msg: "Section group not found" }],
          "Section group not found",
          400,
        );
      }

      nextGroupId = String(group);
      item.group = group;
    }

    const groupChanged = nextGroupId !== oldGroupId;

    if (groupChanged) {
      await shiftItemOrdersAfterDelete(oldGroupId, item.order);
      let targetOrder;
      if (order !== undefined && order !== "") {
        targetOrder = Math.max(1, parseInt(order, 10) || 1);
      } else {
        targetOrder = await getNextItemOrder(nextGroupId);
      }
      await shiftItemOrdersForInsert(nextGroupId, targetOrder, id);
      item.order = targetOrder;
    } else if (order !== undefined && order !== "") {
      const newOrder = Math.max(1, parseInt(order, 10) || 1);
      const oldOrder = item.order;
      if (newOrder !== oldOrder) {
        await applyItemOrderChange(id, nextGroupId, oldOrder, newOrder);
        item.order = newOrder;
      }
    }

    if (isActive !== undefined) {
      item.isActive = parseBoolean(isActive, item.isActive);
    }

    await item.save();
    await item.populate("group", "name direction order isActive");

    return response.successResponse(
      res,
      item,
      "Carousel item updated successfully",
    );
  } catch (error) {
    console.error("Error updating carousel item:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to update carousel item",
      500,
    );
  }
};

/**
 * @route DELETE /api/admin/carousel-sections/:id
 */
const deleteCarouselItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await CarouselItem.findById(id);

    if (!item) {
      return response.errorResponse(res, {}, "Carousel item not found", 404);
    }

    const deletedOrder = item.order;
    const groupId = item.group;

    if (item.imageKey) {
      try {
        await deleteFromR2(item.imageKey);
      } catch (deleteError) {
        console.error("Error deleting image from R2:", deleteError);
      }
    }

    await CarouselItem.findByIdAndDelete(id);
    await shiftItemOrdersAfterDelete(groupId, deletedOrder);

    return response.successResponse(
      res,
      {},
      "Carousel item deleted successfully",
    );
  } catch (error) {
    console.error("Error deleting carousel item:", error);
    return response.errorResponse(
      res,
      {},
      "Failed to delete carousel item",
      500,
    );
  }
};

/**
 * @route GET /api/admin/carousel-sections/groups
 */
const getCarouselGroups = async (req, res) => {
  try {
    const groups = await CarouselGroup.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const groupIds = groups.map((g) => g._id);
    const itemCounts = await CarouselItem.aggregate([
      { $match: { group: { $in: groupIds } } },
      { $group: { _id: "$group", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(
      itemCounts.map((entry) => [String(entry._id), entry.count]),
    );

    const data = groups.map((group) => ({
      ...group,
      itemCount: countMap[String(group._id)] || 0,
    }));

    return response.successResponse(
      res,
      {
        data,
        nextOrder: await getNextGroupOrder(),
      },
      "Carousel groups fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching carousel groups:", error);
    return response.errorResponse(
      res,
      {},
      "Failed to fetch carousel groups",
      500,
    );
  }
};

/**
 * @route POST /api/admin/carousel-sections/groups
 */
const createCarouselGroup = async (req, res) => {
  try {
    const { name, order, isActive, direction } = req.body;

    if (!name || !String(name).trim()) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "Group name is required" }],
        "Group name is required",
        400,
      );
    }

    const trimmedName = String(name).trim();
    const existing = await CarouselGroup.findOne({
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

    let targetOrder;
    if (order !== undefined && order !== "" && order !== null) {
      targetOrder = Math.max(1, parseInt(order, 10) || 1);
      await CarouselGroup.updateMany(
        { order: { $gte: targetOrder } },
        { $inc: { order: 1 } },
      );
    } else {
      targetOrder = await getNextGroupOrder();
    }

    const group = new CarouselGroup({
      name: trimmedName,
      direction: normalizeDirection(direction),
      order: targetOrder,
      isActive: parseBoolean(isActive),
    });

    await group.save();

    return response.successResponse(
      res,
      { ...group.toObject(), itemCount: 0 },
      "Carousel group created successfully",
    );
  } catch (error) {
    console.error("Error creating carousel group:", error);
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
      error.message || "Failed to create carousel group",
      500,
    );
  }
};

/**
 * @route PUT /api/admin/carousel-sections/groups/:id
 */
const updateCarouselGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order, isActive, direction } = req.body;

    const group = await CarouselGroup.findById(id);
    if (!group) {
      return response.errorResponse(res, {}, "Carousel group not found", 404);
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

      const existing = await CarouselGroup.findOne({
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

    if (direction !== undefined) {
      group.direction = normalizeDirection(direction);
    }

    if (order !== undefined && order !== "") {
      const newOrder = Math.max(1, parseInt(order, 10) || 1);
      const oldOrder = group.order;
      if (newOrder !== oldOrder) {
        if (newOrder < oldOrder) {
          await CarouselGroup.updateMany(
            { _id: { $ne: id }, order: { $gte: newOrder, $lt: oldOrder } },
            { $inc: { order: 1 } },
          );
        } else {
          await CarouselGroup.updateMany(
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
    const itemCount = await CarouselItem.countDocuments({ group: id });

    return response.successResponse(
      res,
      { ...group.toObject(), itemCount },
      "Carousel group updated successfully",
    );
  } catch (error) {
    console.error("Error updating carousel group:", error);
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
      error.message || "Failed to update carousel group",
      500,
    );
  }
};

/**
 * @route DELETE /api/admin/carousel-sections/groups/:id
 */
const deleteCarouselGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await CarouselGroup.findById(id);

    if (!group) {
      return response.errorResponse(res, {}, "Carousel group not found", 404);
    }

    const itemCount = await CarouselItem.countDocuments({ group: id });
    if (itemCount > 0) {
      return response.errorResponse(
        res,
        {},
        `Cannot delete group with ${itemCount} item(s). Move or delete items first.`,
        400,
      );
    }

    const deletedOrder = group.order;
    await CarouselGroup.findByIdAndDelete(id);
    await CarouselGroup.updateMany(
      { order: { $gt: deletedOrder } },
      { $inc: { order: -1 } },
    );

    return response.successResponse(
      res,
      {},
      "Carousel group deleted successfully",
    );
  } catch (error) {
    console.error("Error deleting carousel group:", error);
    return response.errorResponse(
      res,
      {},
      "Failed to delete carousel group",
      500,
    );
  }
};

/**
 * @route GET /api/common/carousel-sections
 */
const getPublicCarouselSections = async (req, res) => {
  try {
    const groups = await CarouselGroup.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("name direction order")
      .lean();

    const groupIds = groups.map((g) => g._id);
    const items = await CarouselItem.find({
      isActive: true,
      group: { $in: groupIds },
    })
      .sort({ order: 1, createdAt: -1 })
      .select("name shortDesc imageUrl order group")
      .lean();

    const itemsByGroup = items.reduce((acc, item) => {
      const key = String(item.group);
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        _id: item._id,
        name: item.name || "",
        shortDesc: item.shortDesc || "",
        imageUrl: item.imageUrl || "",
        order: item.order,
      });
      return acc;
    }, {});

    const data = groups
      .map((group) => ({
        _id: group._id,
        name: group.name,
        direction: group.direction === "rtl" ? "rtl" : "ltr",
        order: group.order,
        items: itemsByGroup[String(group._id)] || [],
      }))
      .filter((group) => group.items.length > 0);

    return response.successResponse(
      res,
      data,
      "Active carousel sections fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching public carousel sections:", error);
    return response.errorResponse(
      res,
      {},
      "Failed to fetch carousel sections",
      500,
    );
  }
};

module.exports = {
  createCarouselItem,
  getCarouselItems,
  updateCarouselItem,
  deleteCarouselItem,
  getCarouselGroups,
  createCarouselGroup,
  updateCarouselGroup,
  deleteCarouselGroup,
  getPublicCarouselSections,
};
