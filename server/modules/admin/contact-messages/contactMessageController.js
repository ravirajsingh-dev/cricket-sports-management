const response = require("../../../config/response");
const ContactMessage = require("../../../models/ContactMessage");
const {
  toTitleCase,
  validateEmail,
} = require("../../../shared/utils/inputValidation");

/**
 * @route POST /api/common/contact-messages
 * @desc Public — submit a contact message
 * @access Public
 */
const createContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !String(name).trim()) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "Name is required" }],
        "Name is required",
        400,
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return response.errorResponse(
        res,
        [{ path: "email", msg: emailValidation.error || "Valid email is required" }],
        "Valid email is required",
        400,
      );
    }

    if (!message || !String(message).trim()) {
      return response.errorResponse(
        res,
        [{ path: "message", msg: "Message is required" }],
        "Message is required",
        400,
      );
    }

    const trimmedName = toTitleCase(String(name).trim()).slice(0, 150);
    const trimmedMessage = String(message).trim().replace(/\r\n/g, "\n").slice(0, 500);

    const contactMessage = await ContactMessage.create({
      name: trimmedName,
      email: emailValidation.sanitized,
      message: trimmedMessage,
    });

    return response.successResponse(
      res,
      {
        _id: contactMessage._id,
        name: contactMessage.name,
        email: contactMessage.email,
        createdAt: contactMessage.createdAt,
      },
      "Message sent successfully. We will get back to you soon.",
      201,
    );
  } catch (error) {
    console.error("Error creating contact message:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to send message",
      500,
    );
  }
};

/**
 * @route GET /api/admin/contact-messages
 * @desc Admin — list contact messages
 * @access Private
 */
const getContactMessages = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      orderBy = "createdAt",
      ascending = "desc",
      isRead,
    } = req.query;

    const pageSize = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = pageSize * (Math.max(parseInt(page, 10) || 1, 1) - 1);
    const sortOrder = ascending === "asc" ? 1 : -1;
    const allowedOrderBy = ["createdAt", "name", "email", "isRead"];
    const sortField = allowedOrderBy.includes(orderBy) ? orderBy : "createdAt";

    const filter = {};
    if (isRead === "true" || isRead === true) {
      filter.isRead = true;
    } else if (isRead === "false" || isRead === false) {
      filter.isRead = false;
    }

    const [data, totalRecord] = await Promise.all([
      ContactMessage.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(pageSize)
        .select("name email message isRead readAt createdAt updatedAt")
        .lean(),
      ContactMessage.countDocuments(filter),
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
      "Contact messages fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return response.errorResponse(
      res,
      {},
      "Failed to fetch contact messages",
      500,
    );
  }
};

/**
 * @route GET /api/admin/contact-messages/:id
 * @desc Admin — read a contact message (marks as read)
 * @access Private
 */
const getContactMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    const contactMessage = await ContactMessage.findById(id);
    if (!contactMessage) {
      return response.errorResponse(res, {}, "Contact message not found", 404);
    }

    if (!contactMessage.isRead) {
      contactMessage.isRead = true;
      contactMessage.readAt = new Date();
      await contactMessage.save();
    }

    return response.successResponse(
      res,
      contactMessage,
      "Contact message fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching contact message:", error);
    return response.errorResponse(
      res,
      {},
      "Failed to fetch contact message",
      500,
    );
  }
};

/**
 * @route DELETE /api/admin/contact-messages/:id
 * @desc Admin — delete a contact message
 * @access Private
 */
const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const contactMessage = await ContactMessage.findById(id);

    if (!contactMessage) {
      return response.errorResponse(res, {}, "Contact message not found", 404);
    }

    await ContactMessage.findByIdAndDelete(id);

    return response.successResponse(res, {}, "Contact message deleted successfully");
  } catch (error) {
    console.error("Error deleting contact message:", error);
    return response.errorResponse(
      res,
      {},
      "Failed to delete contact message",
      500,
    );
  }
};

module.exports = {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  deleteContactMessage,
};
