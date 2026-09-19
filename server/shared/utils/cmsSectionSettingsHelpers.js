const CommonSettings = require("../../models/CommonSettings");
const response = require("../../config/response");

const normalizeCmsSectionSettings = (section = {}) => {
  const raw = section?.toObject ? section.toObject() : section || {};
  return {
    title: raw.title?.trim() || "",
    description:
      typeof raw.description === "string"
        ? raw.description.replace(/\r\n/g, "\n")
        : "",
  };
};

/**
 * Shared get / update / public-get handlers for homepage CMS section
 * settings stored on CommonSettings (gallery | news | video).
 *
 * @param {{ fieldKey: string, label: string }} options
 */
const createCmsSectionSettingsHandlers = ({ fieldKey, label }) => {
  if (!fieldKey || !label) {
    throw new Error("createCmsSectionSettingsHandlers requires fieldKey and label");
  }

  const getSettings = async (req, res) => {
    try {
      const settings = await CommonSettings.getOrCreateSettings();
      const section = normalizeCmsSectionSettings(settings[fieldKey]);

      return response.successResponse(
        res,
        section,
        `${label} settings fetched successfully`,
      );
    } catch (error) {
      console.error(`Error fetching ${fieldKey} settings:`, error);
      return response.errorResponse(
        res,
        {},
        `Failed to fetch ${fieldKey} settings`,
        500,
      );
    }
  };

  const updateSettings = async (req, res) => {
    try {
      const { title, description } = req.body;
      const settings = await CommonSettings.getOrCreateSettings();
      const current = settings[fieldKey] || {};

      settings[fieldKey] = normalizeCmsSectionSettings({
        title: title !== undefined ? title : current.title,
        description:
          description !== undefined ? description : current.description,
      });
      settings.markModified(fieldKey);
      await settings.save();

      return response.successResponse(
        res,
        normalizeCmsSectionSettings(settings[fieldKey]),
        `${label} settings updated successfully`,
      );
    } catch (error) {
      console.error(`Error updating ${fieldKey} settings:`, error);
      return response.errorResponse(
        res,
        {},
        error.message || `Failed to update ${fieldKey} settings`,
        500,
      );
    }
  };

  const getPublicSettings = async (req, res) => {
    try {
      const settings = await CommonSettings.getOrCreateSettings();
      const section = normalizeCmsSectionSettings(settings[fieldKey]);

      return response.successResponse(
        res,
        section,
        `${label} settings fetched successfully`,
      );
    } catch (error) {
      console.error(`Error fetching public ${fieldKey} settings:`, error);
      return response.errorResponse(
        res,
        {},
        `Failed to fetch ${fieldKey} settings`,
        500,
      );
    }
  };

  return { getSettings, updateSettings, getPublicSettings };
};

module.exports = {
  createCmsSectionSettingsHandlers,
};
