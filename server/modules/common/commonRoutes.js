const express = require("express");
const router = express.Router();

const {
  getPublicCommonSettings,
} = require("./commonController");
const {
  getPublicSliderBanners,
} = require("../admin/slider/sliderController");
const {
  getPublicGalleryImages,
  getPublicGallerySettings,
} = require("../admin/gallery/galleryController");
const { getPublicVideos, getPublicVideoSettings } = require("../admin/video/videoController");
const {
  getPublicNews,
  getPublicNewsSettings,
} = require("../admin/news/newsController");
const {
  getPublicTeams,
  getPublicTeamSettings,
} = require("../admin/teams/teamController");
const {
  getPublicCarouselSections,
} = require("../admin/carousel-sections/carouselSectionController");
const {
  getPublicFaqs,
  getPublicFaqSettings,
} = require("../admin/faq/faqController");
const {
  getPublicHomeShowcase,
} = require("../admin/home-showcase/homeShowcaseController");
const {
  getPublicHowItWorksSettings,
} = require("../admin/how-it-works/howItWorksController");
const { getPublicLegalPage } = require("../admin/legal-pages/legalPageController");
const {
  createContactMessage,
} = require("../admin/contact-messages/contactMessageController");
const {
  getPublicPlayingRoles,
} = require("../admin/playing-roles/playingRoleController");
const { check, validationResult } = require("express-validator");
const {
  validateEmailField,
} = require("../../shared/middleware/inputValidation");
const response = require("../../config/response");

// @route GET /api/common/settings
// @desc Get public common settings
// @access Public
router.get("/settings", [], getPublicCommonSettings);

// @route POST /api/common/contact-messages
// @desc Submit a contact message
// @access Public
router.post(
  "/contact-messages",
  [
    check("name", "Name is required")
      .isString()
      .trim()
      .notEmpty()
      .isLength({ min: 1, max: 150 })
      .custom((value) => {
        if (/<[^>]*>/g.test(value)) {
          throw new Error("Name cannot contain HTML or script tags");
        }
        if (/\$[a-zA-Z]+/.test(value)) {
          throw new Error("Name contains invalid characters");
        }
        return true;
      }),
    validateEmailField("email", { required: true }),
    check("message", "Message is required")
      .isString()
      .trim()
      .notEmpty()
      .isLength({ min: 1, max: 500 })
      .custom((value) => {
        if (/<[^>]*>/g.test(value)) {
          throw new Error("Message cannot contain HTML or script tags");
        }
        return true;
      }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return response.errorResponse(
          res,
          errors.array(),
          "Please correct the highlighted fields",
          400,
        );
      }
      await createContactMessage(req, res);
    } catch (error) {
      console.error("Error handling contact message submission:", error);
      return response.errorResponse(res, {}, "Internal server error", 500);
    }
  },
);

// @route GET /api/common/slider-banners
// @desc Get active slider banners
// @access Public
router.get("/slider-banners", getPublicSliderBanners);

// @route GET /api/common/gallery/settings
// @desc Get gallery section settings
// @access Public
router.get("/gallery/settings", getPublicGallerySettings);

// @route GET /api/common/gallery
// @desc Get paginated gallery images
// @access Public
router.get("/gallery", getPublicGalleryImages);

// @route GET /api/common/videos/settings
// @desc Get video section settings
// @access Public
router.get("/videos/settings", getPublicVideoSettings);

// @route GET /api/common/videos
// @desc Get active videos
// @access Public
router.get("/videos", getPublicVideos);

// @route GET /api/common/news/settings
// @desc Get news section settings
// @access Public
router.get("/news/settings", getPublicNewsSettings);

// @route GET /api/common/news
// @desc Get active news items
// @access Public
router.get("/news", getPublicNews);

// @route GET /api/common/teams/settings
// @desc Get teams section settings
// @access Public
router.get("/teams/settings", getPublicTeamSettings);

// @route GET /api/common/teams
// @desc Get active teams grouped by pool
// @access Public
router.get("/teams", getPublicTeams);

// @route GET /api/common/carousel-sections
// @desc Get active carousel sections grouped by admin groups
// @access Public
router.get("/carousel-sections", getPublicCarouselSections);

// @route GET /api/common/faqs/settings
// @desc Get FAQ section settings
// @access Public
router.get("/faqs/settings", getPublicFaqSettings);

// @route GET /api/common/faqs
// @desc Get active FAQs
// @access Public
router.get("/faqs", getPublicFaqs);

// @route GET /api/common/home-showcase
// @desc Get Impact / Selectors / Testimonials showcase
// @access Public
router.get("/home-showcase", getPublicHomeShowcase);

// @route GET /api/common/how-it-works/settings
// @desc Get How Our Platform Works section settings
// @access Public
router.get("/how-it-works/settings", getPublicHowItWorksSettings);

// @route GET /api/common/legal-pages/:slug
// @desc Get public legal/policy page by slug
// @access Public
router.get("/legal-pages/:slug", getPublicLegalPage);

// @route GET /api/common/playing-roles
// @desc Get active playing roles for registration
// @access Public
router.get("/playing-roles", getPublicPlayingRoles);

module.exports = router;
