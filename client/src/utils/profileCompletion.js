import {
  TAB_KEYS,
  ADDITIONAL_REQUIRED_FIELDS,
} from "@src/features/user/myAccountConstants";

/** Fallback when server requirements not yet loaded (mirrors server config). */
const FALLBACK_REQUIREMENTS = {
  profile: {
    user: ["email"],
    userDetails: [
      ...ADDITIONAL_REQUIRED_FIELDS,
    ],
  },
  fieldLabels: {
    name: "Full Name",
    phone: "Phone",
    email: "Email",
    dob: "Date of Birth",
    gender: "Gender",
    height: "Height",
    weight: "Weight",
    profile: "Profile Details",
  },
  fieldTabs: {
    name: TAB_KEYS.core,
    phone: TAB_KEYS.core,
    email: TAB_KEYS.core,
    dob: TAB_KEYS.additional,
    gender: TAB_KEYS.additional,
    height: TAB_KEYS.additional,
    weight: TAB_KEYS.additional,
    profile: TAB_KEYS.core,
  },
};

const resolveRequirements = (requirements) =>
  requirements?.profile ? requirements : FALLBACK_REQUIREMENTS;

const isEmptyProfileValue = (key, value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (typeof value === "number" && Number.isNaN(value)) return true;
  if (Array.isArray(value)) return value.length === 0;

  return false;
};

const USER_LEVEL_KEYS = new Set(["name", "phone", "email", "status"]);

const toMissingField = (key, requirements, scope = "profile") => {
  const req = resolveRequirements(requirements);
  return {
    key,
    label: req.fieldLabels?.[key] || key,
    tab: req.fieldTabs?.[key] || TAB_KEYS.core,
    scope,
  };
};

/**
 * @param {object|null} user
 * @param {object|null} userDetails
 * @param {object|null} requirements - from server API
 */
const getMissingProfileFields = (user, userDetails, requirements) => {
  if (!userDetails) {
    return [toMissingField("profile", requirements, "profile")];
  }

  const req = resolveRequirements(requirements);
  const userKeys = req.profile?.user || [];
  const userDetailsKeys = req.profile?.userDetails || [];
  const keysToCheck = [...userKeys, ...userDetailsKeys];

  const missing = [];
  keysToCheck.forEach((key) => {
    const value = USER_LEVEL_KEYS.has(key) ? user?.[key] : userDetails?.[key];
    if (isEmptyProfileValue(key, value)) {
      missing.push(toMissingField(key, requirements));
    }
  });

  return missing;
};

/** Missing general profile fields. */
export const getMissingGeneralProfileFields = (user, userDetails, requirements) =>
  getMissingProfileFields(user, userDetails, requirements);

/** Count missing fields grouped by My Account tab. */
export const getMissingCountByTab = (missingFields) => {
  const counts = {
    [TAB_KEYS.core]: 0,
    [TAB_KEYS.additional]: 0,
    [TAB_KEYS.location]: 0,
  };

  missingFields.forEach((field) => {
    if (field.key === "profile") return;
    if (counts[field.tab] !== undefined) {
      counts[field.tab] += 1;
    }
  });

  return counts;
};
