const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const {
  listLegalPages,
  getLegalPage,
  updateLegalPage,
} = require("./legalPageController");

const auth = [AdminAuth, checkPermission("application-settings")];

router.get("/legal-pages", auth, listLegalPages);
router.get("/legal-pages/:slug", auth, getLegalPage);
router.put("/legal-pages/:slug", auth, updateLegalPage);

module.exports = router;
