import {
  TAB_KEYS,
  CORE_FIELDS,
  ADDITIONAL_FIELDS,
  LOCATION_FIELDS,
} from "./myAccountConstants";
import { DEFAULT_COUNTRY } from "@src/utils/locationData";

const INITIAL_FORM_DATA = {
  name: "",
  memberId: "",
  phone: "",
  email: "",
  dob: "",
  gender: "",
  height: "",
  weight: "",
  address: "",
  country: DEFAULT_COUNTRY.name,
  countryId: DEFAULT_COUNTRY.id,
  state: "",
  stateId: "",
  city: "",
  cityId: "",
};

export const buildFormDataFromProfile = (data) => {
  if (!data) return { ...INITIAL_FORM_DATA };

  const ud = data.userDetails || {};

  return {
    name: data.name || "",
    memberId: data.memberId || "",
    phone: data.phone || "",
    email: data.email || "",
    dob: ud.dob ? new Date(ud.dob).toISOString().split("T")[0] : "",
    gender: ud.gender || "",
    height:
      ud.height != null && ud.height !== "" ? String(ud.height) : "",
    weight:
      ud.weight != null && ud.weight !== "" ? String(ud.weight) : "",
    address: data.address || "",
    country: data.country || DEFAULT_COUNTRY.name,
    countryId: data.countryId || DEFAULT_COUNTRY.id,
    state: data.state || "",
    stateId: data.stateId || "",
    city: data.city || "",
    cityId: data.cityId || "",
  };
};

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

const isSelectValue = (value) =>
  value &&
  typeof value === "object" &&
  value.value != null &&
  value.value !== "";

const isFieldEqual = (current, original) => {
  if (current === original) return true;
  if (isSelectValue(current) || isSelectValue(original)) {
    return (current?.value ?? null) === (original?.value ?? null);
  }
  return String(current ?? "") === String(original ?? "");
};

export const isSectionEdited = (tabKey, formData, originalSnapshot) => {
  if (!originalSnapshot) return false;
  return getTabFields(tabKey).some(
    (field) => !isFieldEqual(formData[field], originalSnapshot[field]),
  );
};

export const buildSubmitDataForTab = (tabKey, formData) => {
  switch (tabKey) {
    case TAB_KEYS.core:
      return {
        name: formData.name.trim(),
        email: formData.email ? formData.email.trim() : "",
      };
    case TAB_KEYS.additional:
      return {
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        height:
          formData.height !== "" && formData.height != null
            ? Number(formData.height)
            : undefined,
        weight:
          formData.weight !== "" && formData.weight != null
            ? Number(formData.weight)
            : undefined,
      };
    case TAB_KEYS.location:
      return {
        address: formData.address ? String(formData.address).trim() : "",
        country: DEFAULT_COUNTRY.name,
        countryId: DEFAULT_COUNTRY.id,
        state: formData.state || "",
        stateId: Number(formData.stateId) || undefined,
        city: formData.city || "",
        cityId: Number(formData.cityId) || undefined,
      };
    default:
      return {};
  }
};

export const stripEmptyValues = (data) => {
  const next = { ...data };
  Object.keys(next).forEach((key) => {
    if (
      next[key] === "" ||
      next[key] === null ||
      next[key] === undefined
    ) {
      delete next[key];
    }
  });
  return next;
};
