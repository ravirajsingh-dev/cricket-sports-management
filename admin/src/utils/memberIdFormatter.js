/**
 * Utility functions for formatting and validating Member ID input
 * Format: <Abbreviation><10-digit-phone> (e.g., LTCL9876543210)
 * Abbreviation is fixed (from Application Settings); user only enters phone digits.
 */

export const MEMBER_ID_PHONE_LENGTH = 10;
const MEMBER_ID_ABBREVIATION_MAX_LENGTH = 20;

/**
 * Normalize abbreviation to uppercase letters only
 * @param {string} [abbreviation]
 * @returns {string}
 */
export const normalizeAbbreviation = (abbreviation = "") =>
  String(abbreviation || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .substring(0, MEMBER_ID_ABBREVIATION_MAX_LENGTH);

/**
 * Keep only up to 10 phone digits
 * @param {string} value
 * @returns {string}
 */
const formatPhoneDigits = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .substring(0, MEMBER_ID_PHONE_LENGTH);

/**
 * Build full Member ID from abbreviation + phone
 * @param {string} abbreviation
 * @param {string} phone
 * @returns {string}
 */
const buildMemberId = (abbreviation, phone) => {
  const prefix = normalizeAbbreviation(abbreviation);
  const phoneDigits = formatPhoneDigits(phone);
  if (!phoneDigits) return "";
  // Phone-only is allowed temporarily until abbreviation settings load
  if (!prefix) return phoneDigits;
  return `${prefix}${phoneDigits}`;
};

/**
 * Extract the editable phone part from a full Member ID
 * @param {string} memberId
 * @param {string} [abbreviation]
 * @returns {string}
 */
export const getMemberIdPhonePart = (memberId, abbreviation = "") => {
  const full = String(memberId || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (!full) return "";

  const prefix = normalizeAbbreviation(abbreviation);
  if (prefix && full.startsWith(prefix)) {
    return formatPhoneDigits(full.slice(prefix.length));
  }

  const digits = full.replace(/\D/g, "");
  if (digits.length >= MEMBER_ID_PHONE_LENGTH) {
    return digits.slice(-MEMBER_ID_PHONE_LENGTH);
  }
  return digits.substring(0, MEMBER_ID_PHONE_LENGTH);
};

/**
 * Phone-only placeholder
 * @returns {string}
 */
export const getMemberIdPhonePlaceholder = () => "9876543210";

/**
 * Change handler for phone-only Member ID input (emits full Abbreviation+Phone)
 * @param {Function} baseOnChange
 * @param {string} fieldName
 * @param {string} abbreviation
 * @returns {Function}
 */
export const createMemberIdChangeHandler = (
  baseOnChange,
  fieldName,
  abbreviation = "",
) => {
  return (e) => {
    const phoneDigits = formatPhoneDigits(e.target.value);
    const formatted = buildMemberId(abbreviation, phoneDigits);

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: fieldName,
        value: formatted,
      },
    };

    baseOnChange(syntheticEvent);
  };
};
