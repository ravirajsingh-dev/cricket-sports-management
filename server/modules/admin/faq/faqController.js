const response = require("../../../config/response");
const Faq = require("../../../models/Faq");
const {
  createCmsSectionSettingsHandlers,
} = require("../../../shared/utils/cmsSectionSettingsHelpers");

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined) {
    return defaultValue;
  }
  return value === "true" || value === true;
};

const getNextOrder = async () => {
  const maxFaq = await Faq.findOne().sort({ order: -1 }).select("order").lean();
  return (maxFaq?.order ?? 0) + 1;
};

const shiftOrdersForInsert = async (targetOrder, excludeId = null) => {
  const filter = { order: { $gte: targetOrder } };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  await Faq.updateMany(filter, { $inc: { order: 1 } });
};

const applyOrderChange = async (faqId, oldOrder, newOrder) => {
  if (oldOrder === newOrder) {
    return;
  }

  if (newOrder < oldOrder) {
    await Faq.updateMany(
      { _id: { $ne: faqId }, order: { $gte: newOrder, $lt: oldOrder } },
      { $inc: { order: 1 } },
    );
  } else {
    await Faq.updateMany(
      { _id: { $ne: faqId }, order: { $gt: oldOrder, $lte: newOrder } },
      { $inc: { order: -1 } },
    );
  }
};

const shiftOrdersAfterDelete = async (deletedOrder) => {
  await Faq.updateMany(
    { order: { $gt: deletedOrder } },
    { $inc: { order: -1 } },
  );
};

/**
 * @route POST /api/admin/faq
 */
const createFaq = async (req, res) => {
  try {
    const { question, answer, order, isActive } = req.body;

    if (!question || !String(question).trim()) {
      return response.errorResponse(
        res,
        [{ path: "question", msg: "Question is required" }],
        "Question is required",
        400,
      );
    }

    if (!answer || !String(answer).trim()) {
      return response.errorResponse(
        res,
        [{ path: "answer", msg: "Answer is required" }],
        "Answer is required",
        400,
      );
    }

    let targetOrder;
    if (order !== undefined && order !== "" && order !== null) {
      targetOrder = Math.max(1, parseInt(order, 10) || 1);
      await shiftOrdersForInsert(targetOrder);
    } else {
      targetOrder = await getNextOrder();
    }

    const faq = new Faq({
      question: String(question).trim(),
      answer: String(answer).trim().replace(/\r\n/g, "\n"),
      order: targetOrder,
      isActive: parseBoolean(isActive),
    });

    await faq.save();

    return response.successResponse(res, faq, "FAQ created successfully");
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to create FAQ",
      500,
    );
  }
};

/**
 * @route GET /api/admin/faq
 */
const getFaqs = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      orderBy = "order",
      ascending = "asc",
    } = req.query;

    const pageSize = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = pageSize * (Math.max(parseInt(page, 10) || 1, 1) - 1);
    const sortOrder = ascending === "desc" ? -1 : 1;
    const allowedOrderBy = ["order", "question", "createdAt", "isActive"];
    const sortField = allowedOrderBy.includes(orderBy) ? orderBy : "order";

    const [data, totalRecord, nextOrder] = await Promise.all([
      Faq.find({})
        .sort({ [sortField]: sortOrder, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Faq.countDocuments({}),
      getNextOrder(),
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
      "FAQs fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return response.errorResponse(res, {}, "Failed to fetch FAQs", 500);
  }
};

/**
 * @route PUT /api/admin/faq/:id
 */
const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, order, isActive } = req.body;

    const faq = await Faq.findById(id);
    if (!faq) {
      return response.errorResponse(res, {}, "FAQ not found", 404);
    }

    if (question !== undefined) {
      const trimmed = String(question).trim();
      if (!trimmed) {
        return response.errorResponse(
          res,
          [{ path: "question", msg: "Question is required" }],
          "Question is required",
          400,
        );
      }
      faq.question = trimmed;
    }

    if (answer !== undefined) {
      const trimmed = String(answer).trim().replace(/\r\n/g, "\n");
      if (!trimmed) {
        return response.errorResponse(
          res,
          [{ path: "answer", msg: "Answer is required" }],
          "Answer is required",
          400,
        );
      }
      faq.answer = trimmed;
    }

    if (order !== undefined && order !== "") {
      const newOrder = Math.max(1, parseInt(order, 10) || 1);
      const oldOrder = faq.order;
      if (newOrder !== oldOrder) {
        await applyOrderChange(id, oldOrder, newOrder);
        faq.order = newOrder;
      }
    }

    if (isActive !== undefined) {
      faq.isActive = parseBoolean(isActive, faq.isActive);
    }

    await faq.save();

    return response.successResponse(res, faq, "FAQ updated successfully");
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to update FAQ",
      500,
    );
  }
};

/**
 * @route DELETE /api/admin/faq/:id
 */
const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await Faq.findById(id);

    if (!faq) {
      return response.errorResponse(res, {}, "FAQ not found", 404);
    }

    const deletedOrder = faq.order;
    await Faq.findByIdAndDelete(id);
    await shiftOrdersAfterDelete(deletedOrder);

    return response.successResponse(res, {}, "FAQ deleted successfully");
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return response.errorResponse(res, {}, "Failed to delete FAQ", 500);
  }
};

/**
 * @route GET /api/common/faqs
 */
const getPublicFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("question answer order")
      .lean();

    return response.successResponse(
      res,
      faqs,
      "Active FAQs fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching public FAQs:", error);
    return response.errorResponse(res, {}, "Failed to fetch FAQs", 500);
  }
};

const {
  getSettings: getFaqSettings,
  updateSettings: updateFaqSettings,
  getPublicSettings: getPublicFaqSettings,
} = createCmsSectionSettingsHandlers({
  fieldKey: "faq",
  label: "FAQ",
});

module.exports = {
  createFaq,
  getFaqs,
  updateFaq,
  deleteFaq,
  getFaqSettings,
  updateFaqSettings,
  getPublicFaqs,
  getPublicFaqSettings,
};
