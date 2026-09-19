const express = require("express");
const router = express.Router();

router.use("/auth/admin", require("./auth/adminAuthRoutes"));
router.use("/admin/users", require("./usersRoutes"));
router.use("/admin/dashboard", require("./dashboard/dashboardRoutes"));
router.use("/admin", require("./settingsRoutes"));
router.use("/admin", require("./profileRoutes"));
router.use("/admin", require("./legal-pages/legalPageRoutes"));
router.use("/admin/slider", require("./slider/sliderRoutes"));
router.use("/admin/gallery", require("./gallery/galleryRoutes"));
router.use("/admin/video", require("./video/videoRoutes"));
router.use("/admin/news", require("./news/newsRoutes"));
router.use("/admin/teams", require("./teams/teamRoutes"));
router.use(
  "/admin/carousel-sections",
  require("./carousel-sections/carouselSectionRoutes"),
);
router.use("/admin/faq", require("./faq/faqRoutes"));
router.use("/admin/home-showcase", require("./home-showcase/homeShowcaseRoutes"));
router.use("/admin/how-it-works", require("./how-it-works/howItWorksRoutes"));
router.use(
  "/admin/contact-messages",
  require("./contact-messages/contactMessageRoutes"),
);
router.use("/admin/playing-roles", require("./playing-roles/playingRoleRoutes"));
router.use("/admin/sub-admins", require("./sub-admins/subAdminRoutes"));

module.exports = router;
