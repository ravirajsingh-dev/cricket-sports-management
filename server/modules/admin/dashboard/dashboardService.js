const User = require("../../../models/User");
const News = require("../../../models/News");
const Video = require("../../../models/Video");
const ImageGallery = require("../../../models/ImageGallery");
const SliderBanner = require("../../../models/SliderBanner");
const Team = require("../../../models/Team");
const Faq = require("../../../models/Faq");
const ContactMessage = require("../../../models/ContactMessage");
const SubAdmin = require("../../../models/SubAdmin");

/**
 * Aggregate portal counts for the admin dashboard.
 */
const getDashboardStats = async () => {
  const [
    users,
    news,
    videos,
    galleryImages,
    sliderBanners,
    teams,
    faqs,
    contactMessages,
    subAdmins,
  ] = await Promise.all([
    User.countDocuments({}),
    News.countDocuments({}),
    Video.countDocuments({}),
    ImageGallery.countDocuments({}),
    SliderBanner.countDocuments({}),
    Team.countDocuments({}),
    Faq.countDocuments({}),
    ContactMessage.countDocuments({}),
    SubAdmin.countDocuments({}),
  ]);

  return {
    users,
    news,
    videos,
    galleryImages,
    sliderBanners,
    teams,
    faqs,
    contactMessages,
    subAdmins,
  };
};

module.exports = {
  getDashboardStats,
};
