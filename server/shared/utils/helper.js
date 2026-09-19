var bcrypt = require("bcryptjs");

module.exports.isAdminIDValid = (adminId) => {
  if (!adminId || typeof adminId !== "string") return false;

  // Trim whitespace
  const trimmedId = adminId.trim();

  // Check length first (8-15 characters as per schema)
  if (trimmedId.length < 8 || trimmedId.length > 15) return false;

  // Admin ID validation: alphanumeric only (letters and numbers), case-insensitive
  // Pattern: 8-15 alphanumeric characters
  const adminIDRegex = /^[A-Z0-9]+$/i;
  return adminIDRegex.test(trimmedId);
};

module.exports.comparePasswords = async (plainPassword, hashedPassword) => {
  try {
    const validPassword = await bcrypt.compare(plainPassword, hashedPassword);
    return validPassword;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
};

module.exports.parseTokenExpiryTime = (tokenExpiryTime) => {
  const unit = tokenExpiryTime.slice(-1);
  const value = parseInt(tokenExpiryTime.slice(0, -1));

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "m":
      return value * 60 * 1000;
    case "s":
      return value * 1000;
    default:
      throw new Error("Invalid token expiry time unit");
  }
};

/**
 * Generate Member ID from Application Settings abbreviation + phone.
 * Format: <ABBREVIATION><10-digit-phone> (e.g., LTCL9876543210)
 * Uniqueness is verified against the users collection before returning.
 */
module.exports.generateMemberId = async (phone, session = null) => {
  const User = require("../../models/User");
  const CommonSettings = require("../../models/CommonSettings");

  const phoneStr = String(phone || "").trim();
  if (!/^\d{10}$/.test(phoneStr)) {
    throw new Error("Invalid phone number format");
  }

  const settings = await CommonSettings.getOrCreateSettings();
  const abbreviation = String(settings.abbreviation || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  if (!abbreviation) {
    throw new Error(
      "Application abbreviation is not configured. Please set it in Application Settings > General Information.",
    );
  }

  const memberId = `${abbreviation}${phoneStr}`;

  const existingMemberId = session
    ? await User.findOne({ memberId }).session(session).lean()
    : await User.findOne({ memberId }).lean();

  if (existingMemberId) {
    throw new Error("Member ID collision detected. Please try again.");
  }

  return memberId;
};

