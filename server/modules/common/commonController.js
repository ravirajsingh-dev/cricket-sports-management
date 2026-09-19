var response = require("../../config/response");
const CommonSettings = require("../../models/CommonSettings");
const {
  normalizeSocialMediaLinks,
} = require("../../shared/utils/socialMediaHelpers");
const {
  normalizeHeroSettings,
} = require("../../shared/utils/heroSettingsHelpers");

const normalizePublicAboutUs = (aboutUs = {}) => {
  const raw = aboutUs?.toObject ? aboutUs.toObject() : aboutUs || {};
  const title = raw.title || "";
  const intro = raw.intro || "";

  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .map((sec, index) => ({
          id: sec?.id || `sec_${index}`,
          heading: sec?.heading || "",
          description: sec?.description || "",
          imageUrl: sec?.imageUrl || "",
          order: typeof sec?.order === "number" ? sec.order : index,
        }))
        .sort((a, b) => a.order - b.order)
    : [];

  return { title, intro, sections };
};

const normalizePublicContactUs = (contactUsPage = {}) => {
  const raw = contactUsPage?.toObject
    ? contactUsPage.toObject()
    : contactUsPage || {};
  return {
    title: raw.title || "",
    intro: raw.intro || "",
    phone: raw.phone || "",
    secondaryPhone: raw.secondaryPhone || "",
    email: raw.email || "",
    address: raw.address || "",
    businessHours: raw.businessHours || "",
  };
};

const getPublicCommonSettings = async (req, res) => {
  try {
    const settings = await CommonSettings.getOrCreateSettings();
    const settingsObj = settings.toObject ? settings.toObject() : settings;

    const publicSettings = {
      name: settingsObj.name || "",
      abbreviation: settingsObj.abbreviation || "",
      developedBy: settingsObj.developedBy || "",
      developedByLink: settingsObj.developedByLink || "",
      logoUrl: settingsObj.logoUrl || "",
      socialMedia: {
        links: normalizeSocialMediaLinks(settingsObj.socialMedia),
      },
      aboutUs: normalizePublicAboutUs(settingsObj.aboutUs),
      contactUsPage: normalizePublicContactUs(settingsObj.contactUsPage),
      hero: normalizeHeroSettings(settingsObj.hero),
      loginEnabled: settingsObj.loginEnabled !== false,
      registerEnabled: settingsObj.registerEnabled !== false,
    };

    return response.successResponse(
      res,
      publicSettings,
      "Public settings retrieved successfully.",
    );
  } catch (err) {
    console.error("Error in getPublicCommonSettings:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getPublicCommonSettings,
};
