import { validateForm } from "@src/utils/validation";
import { isValidEmail } from "@src/utils/inputValidation";
import {
  TAB_KEYS,
  ADDITIONAL_REQUIRED_FIELDS,
  LOCATION_REQUIRED_FIELDS,
  CORE_FIELDS,
  ADDITIONAL_FIELDS,
  LOCATION_FIELDS,
  FIELD_CONSTRAINTS,
} from "./editUserConstants";

const minLengthRule = (path, minLength, label) => ({
  path,
  msg: `${label} must be at least ${minLength} characters`,
  validator: (value) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return true;
    return trimmed.length >= minLength;
  },
});

const maxLengthRule = (path, maxLength, label) => ({
  path,
  msg: `${label} must be at most ${maxLength} characters`,
  validator: (value) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return true;
    return trimmed.length <= maxLength;
  },
});

const isSelectValue = (value) =>
  value &&
  typeof value === "object" &&
  value.value != null &&
  value.value !== "";

const isEmptyValue = (value) => {
  if (value == null || value === "") return true;
  if (typeof value === "object" && "value" in value) return !value.value;
  return false;
};

const isFieldEqual = (current, original) => {
  if (current === original) return true;
  if (isSelectValue(current) || isSelectValue(original)) {
    return (current?.value ?? null) === (original?.value ?? null);
  }
  return String(current ?? "") === String(original ?? "");
};

export const hasAdditionalDetails = (snapshot) =>
  ADDITIONAL_REQUIRED_FIELDS.every((field) => !isEmptyValue(snapshot?.[field]));

export const hasLocationDetails = (snapshot) =>
  LOCATION_REQUIRED_FIELDS.every((field) => !isEmptyValue(snapshot?.[field]));

const getTabFields = (tabKey) => {
  switch (tabKey) {
    case TAB_KEYS.core:
      return CORE_FIELDS;
    case TAB_KEYS.additional:
      return ADDITIONAL_FIELDS;
    case TAB_KEYS.location:
      return LOCATION_FIELDS;
    default:
      return [];
  }
};

export const isSectionEdited = (tabKey, formData, originalSnapshot) => {
  if (!originalSnapshot) return false;
  return getTabFields(tabKey).some(
    (field) => !isFieldEqual(formData[field], originalSnapshot[field]),
  );
};

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
  const errors = [];
  const guardedFields =
    tabKey === TAB_KEYS.location
      ? LOCATION_REQUIRED_FIELDS
      : getTabFields(tabKey);

  guardedFields.forEach((field) => {
    if (field === "password" || field === "address") return;
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
  { formData, originalSnapshot, showPasswordField },
) => {
  const sectionFilled = getSectionFilled(tabKey, originalSnapshot);
  const sectionEdited = isSectionEdited(tabKey, formData, originalSnapshot);

  if (!sectionFilled && !sectionEdited) {
    return [];
  }

  const rules = [];

  if (tabKey === TAB_KEYS.core) {
    const { name, password: passwordLimits } = FIELD_CONSTRAINTS;
    rules.push(
      { path: "name", msg: "Name is required" },
      minLengthRule("name", name.minLength, "Name"),
      maxLengthRule("name", name.maxLength, "Name"),
      { path: "phone", msg: "Phone is required" },
      {
        path: "phone",
        msg: "Phone must be exactly 10 digits",
        validator: (value) => /^\d{10}$/.test(String(value).trim()),
      },
      { path: "status", msg: "Status is required" },
      {
        path: "email",
        msg: "Email is required",
      },
      {
        path: "email",
        msg: "Please enter a valid email address",
        validator: (value) => isValidEmail(value),
      },
    );
    if (showPasswordField) {
      rules.push(
        {
          path: "password",
          msg: "Password is required when changing password",
        },
        minLengthRule("password", passwordLimits.minLength, "Password"),
        maxLengthRule("password", passwordLimits.maxLength, "Password"),
      );
    }
    return rules;
  }

  if (tabKey === TAB_KEYS.additional) {
    rules.push(
      { path: "dob", msg: "Date of birth is required" },
      { path: "gender", msg: "Gender is required" },
    );
    return rules;
  }

  if (tabKey === TAB_KEYS.location) {
    const { address } = FIELD_CONSTRAINTS;
    rules.push(
      {
        path: "state",
        msg: "Please select a state",
        validator: () =>
          Boolean(String(formData.state || "").trim()) &&
          Boolean(Number(formData.stateId)),
      },
      {
        path: "city",
        msg: "Please select a city",
        validator: () =>
          Boolean(String(formData.city || "").trim()) &&
          Boolean(Number(formData.cityId)),
      },
      maxLengthRule("address", address.maxLength, "Address"),
    );
    return rules;
  }

  return rules;
};

export const validateTab = (
  tabKey,
  { formData, originalSnapshot, showPasswordField },
) => {
  const sectionFilled = getSectionFilled(tabKey, originalSnapshot);
  const sectionEdited = isSectionEdited(tabKey, formData, originalSnapshot);

  if (!sectionFilled && !sectionEdited) {
    return { valid: false, noChanges: true, errors: [] };
  }

  const rules = getValidationRulesForTab(tabKey, {
    formData,
    originalSnapshot,
    showPasswordField,
  });

  const errors = [
    ...validateForm(formData, rules),
    ...getCannotBlankErrors(tabKey, formData, originalSnapshot),
  ];

  return { valid: errors.length === 0, noChanges: false, errors };
};

export const buildSubmitDataForTab = (
  tabKey,
  formData,
  { showPasswordField },
) => {
  const submitData = {};

  const includeField = (key) => {
    if (key === "password" && !showPasswordField) return;

    if (
      formData[key] !== "" &&
      formData[key] !== null &&
      formData[key] !== undefined
    ) {
      submitData[key] = formData[key];
    }
  };

  if (tabKey === TAB_KEYS.core) {
    CORE_FIELDS.forEach((key) => {
      includeField(key);
    });
    return submitData;
  }

  if (tabKey === TAB_KEYS.additional) {
    ADDITIONAL_FIELDS.forEach((key) => {
      includeField(key);
    });
    return submitData;
  }

  if (tabKey === TAB_KEYS.location) {
    LOCATION_FIELDS.forEach((key) => {
      includeField(key);
    });
    submitData.country = formData.country || "India";
    submitData.countryId = formData.countryId || 101;
    if (formData.address === "") {
      submitData.address = "";
    }
    return submitData;
  }

  return submitData;
};
