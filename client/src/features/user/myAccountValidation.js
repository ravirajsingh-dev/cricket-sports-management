import { validateForm } from "@src/utils/validation";
import {
  TAB_KEYS,
  ADDITIONAL_REQUIRED_FIELDS,
  LOCATION_REQUIRED_FIELDS,
} from "./myAccountConstants";
import { isSectionEdited } from "./myAccountUtils";

const isEmptyValue = (value) => {
  if (value == null || value === "") return true;
  if (typeof value === "object" && "value" in value) return !value.value;
  return false;
};

export const hasAdditionalDetails = (snapshot) =>
  ADDITIONAL_REQUIRED_FIELDS.every((field) => !isEmptyValue(snapshot?.[field]));

export const hasLocationDetails = (snapshot) =>
  LOCATION_REQUIRED_FIELDS.every((field) => !isEmptyValue(snapshot?.[field]));

const getSectionFilled = (tabKey, originalSnapshot) => {
  switch (tabKey) {
    case TAB_KEYS.core:
      return true;
    case TAB_KEYS.additional:
      return hasAdditionalDetails(originalSnapshot);
    case TAB_KEYS.location:
      return hasLocationDetails(originalSnapshot);
    default:
      return false;
  }
};

const getCannotBlankErrors = (tabKey, formData, originalSnapshot) => {
  const fieldsByTab = {
    [TAB_KEYS.core]: ["name", "email"],
    [TAB_KEYS.additional]: ADDITIONAL_REQUIRED_FIELDS,
    [TAB_KEYS.location]: LOCATION_REQUIRED_FIELDS,
  };
  const errors = [];
  (fieldsByTab[tabKey] || []).forEach((field) => {
    const original = originalSnapshot?.[field];
    const current = formData[field];
    if (!isEmptyValue(original) && isEmptyValue(current)) {
      const label = field
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase());
      errors.push({
        path: field,
        msg: `${label.trim()} cannot be cleared once set`,
      });
    }
  });
  return errors;
};

const getValidationRulesForTab = (
  tabKey,
  { formData, originalSnapshot },
) => {
  const sectionFilled = getSectionFilled(tabKey, originalSnapshot);
  const sectionEdited = isSectionEdited(tabKey, formData, originalSnapshot);

  if (!sectionFilled && !sectionEdited) {
    return [];
  }

  const rules = [];

  if (tabKey === TAB_KEYS.core) {
    rules.push(
      {
        path: "name",
        msg: "Name is required",
        validator: (value) => value && value.trim().length >= 3,
      },
      {
        path: "email",
        msg: "Email is required",
        validator: (value) => value && value.trim().length > 0,
      },
      {
        path: "email",
        msg: "Invalid email format",
        validator: (value) => !value || /\S+@\S+\.\S+/.test(value),
      },
    );
  }

  if (tabKey === TAB_KEYS.additional) {
    rules.push(
      {
        path: "dob",
        msg: "Date of birth is required",
        validator: (value) => value && value.trim().length > 0,
      },
      {
        path: "dob",
        msg: "Date of birth cannot be in the future",
        validator: (value) => {
          if (!value) return false;
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return selectedDate <= today;
        },
      },
      {
        path: "dob",
        msg: "Minimum age must be 3 years",
        validator: (value) => {
          if (!value) return false;
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const minDate = new Date(today);
          minDate.setFullYear(today.getFullYear() - 3);
          return selectedDate <= minDate;
        },
      },
      {
        path: "gender",
        msg: "Gender is required",
        validator: (value) => value && value.trim().length > 0,
      },
      {
        path: "gender",
        msg: "Gender must be one of: male, female, other",
        validator: (value) => {
          if (!value) return true;
          return ["male", "female", "other"].includes(value);
        },
      },
      {
        path: "height",
        msg: "Height must be between 0 and 300",
        validator: (value) => {
          if (value === "" || value == null) return true;
          const n = Number(value);
          return !Number.isNaN(n) && n >= 0 && n <= 300;
        },
      },
      {
        path: "weight",
        msg: "Weight must be between 0 and 500",
        validator: (value) => {
          if (value === "" || value == null) return true;
          const n = Number(value);
          return !Number.isNaN(n) && n >= 0 && n <= 500;
        },
      },
    );
  }

  if (tabKey === TAB_KEYS.location) {
    rules.push(
      {
        path: "state",
        msg: "Please select your state",
        validator: () =>
          Boolean(String(formData.state || "").trim()) &&
          Boolean(Number(formData.stateId)),
      },
      {
        path: "city",
        msg: "Please select your city",
        validator: () =>
          Boolean(String(formData.city || "").trim()) &&
          Boolean(Number(formData.cityId)),
      },
      {
        path: "address",
        msg: "Address must be at most 500 characters",
        validator: (value) => {
          if (value == null || value === "") return true;
          return String(value).trim().length <= 500;
        },
      },
    );
  }

  return rules;
};

export const validateTab = (tabKey, { formData, originalSnapshot }) => {
  if (!originalSnapshot) {
    return { valid: false, errors: [], noChanges: true };
  }

  if (!isSectionEdited(tabKey, formData, originalSnapshot)) {
    return { valid: true, errors: [], noChanges: true };
  }

  const rules = getValidationRulesForTab(tabKey, {
    formData,
    originalSnapshot,
  });

  const errors = [
    ...validateForm(formData, rules),
    ...getCannotBlankErrors(tabKey, formData, originalSnapshot),
  ];

  return {
    valid: errors.length === 0,
    errors,
    noChanges: false,
  };
};
