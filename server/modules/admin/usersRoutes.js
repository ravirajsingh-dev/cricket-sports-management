const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { AdminAuth } = require("../../shared/middleware/auth");
const { checkPermission } = require("../../shared/middleware/permissions");
const verifyTransactionPassword = require("../../shared/middleware/verifyTransactionPassword");

const {
  getUsersList,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
  blockUser,
  unblockUser,
} = require("./users/adminUserController");

// @route GET api/admin/users/list
// @desc Get users list
// @access Private
router.get(
  "/list",
  [AdminAuth, checkPermission("users", "list")],
  getUsersList,
);

// @route POST api/admin/users
// @desc Create new user with core information (name, phone, email, password)
// @access Private
router.post("/", [AdminAuth, checkPermission("users", "create")], createUser);

// @route POST api/admin/users/:user_id/block
// @desc Block user account
// @access Private
router.post(
  "/:user_id/block",
  [
    AdminAuth,
    checkPermission("users", "edit"),
    verifyTransactionPassword,
    check("remarks").optional().isString().isLength({ max: 500 }),
  ],
  blockUser,
);

// @route POST api/admin/users/:user_id/unblock
// @desc Unblock user account
// @access Private
router.post(
  "/:user_id/unblock",
  [
    AdminAuth,
    checkPermission("users", "edit"),
    verifyTransactionPassword,
    check("remarks").optional().isString().isLength({ max: 500 }),
  ],
  unblockUser,
);

// @route GET api/admin/users/:user_id
// @desc Get user by user_id
// @access Private
router.get(
  "/:user_id",
  [AdminAuth, checkPermission("users", "list")],
  getUserById,
);

// @route PUT api/admin/users/:user_id
// @desc Update user profile by user_id
// @access Private
router.put(
  "/:user_id",
  [AdminAuth, checkPermission("users", "edit"), verifyTransactionPassword],
  updateUserById,
);

// @route DELETE api/admin/users/:user_id
// @desc Delete user by user_id
// @access Private
router.delete(
  "/:user_id",
  [AdminAuth, checkPermission("users", "delete"), verifyTransactionPassword],
  deleteUserById,
);

module.exports = router;
