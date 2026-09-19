/**
 * Utility functions for formatting and validating Member ID input
 * Format: <Abbreviation><10-digit-phone> (e.g., LTCL9876543210)
 * Abbreviation is fixed (from Application Settings); user only enters phone digits.
 */

export const MEMBER_ID_PHONE_LENGTH = 10;
const MEMBER_ID_ABBREVIATION_MAX_LENGTH = 20;

/** Regex for a complete Member ID: letters + exactly 10 phone digits */
const MEMBER_ID_REGEX = /^[A-Z]{1,20}\d{10}$/;

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
 * Hint text for Member ID fields
 * @param {string} [abbreviation]
 * @returns {string}
 */
export const getMemberIdHint = (abbreviation = "") => {
  const prefix = normalizeAbbreviation(abbreviation);
  if (prefix) {
    return `Your Member ID is ${prefix} + your 10-digit phone number`;
  }
  return "Abbreviation + your 10-digit phone number";
};

/**
 * Validates complete Member ID format (Abbreviation + 10-digit phone)
 * @param {string} value
 * @param {string} [abbreviation] - When provided, prefix must match
 * @returns {boolean}
 */
export const isValidMemberIdFormat = (value, abbreviation = "") => {
  if (!value) return false;
  const sanitized = String(value).trim().toUpperCase();
  if (!MEMBER_ID_REGEX.test(sanitized)) return false;

  const prefix = normalizeAbbreviation(abbreviation);
  if (prefix && !sanitized.startsWith(prefix)) return false;
  if (prefix && sanitized.slice(prefix.length).length !== MEMBER_ID_PHONE_LENGTH) {
    return false;
  }
  return true;
};

/**
 * Formats a pasted/typed value into a full Member ID using the fixed abbreviation
 * @param {string} value
 * @param {string} [abbreviation]
 * @returns {string}
 */
const formatMemberIdInput = (value, abbreviation = "") => {
  const prefix = normalizeAbbreviation(abbreviation);
  const raw = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  let phoneDigits = "";
  if (prefix && raw.startsWith(prefix)) {
    phoneDigits = formatPhoneDigits(raw.slice(prefix.length));
  } else {
    phoneDigits = formatPhoneDigits(raw);
  }

  return buildMemberId(prefix, phoneDigits);
};

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

/**
 * Paste handler: accepts full Member ID or phone digits only
 * @param {string} abbreviation
 * @returns {Function}
 */
export const createMemberIdPasteHandler = (abbreviation = "") => {
  return (e) => {
    const pastedText = e.clipboardData.getData("text/plain");
    if (!pastedText || !pastedText.trim()) return;

    const cleaned = formatMemberIdInput(pastedText.trim(), abbreviation);
    if (!cleaned) {
      e.preventDefault();
    }
  };
};
