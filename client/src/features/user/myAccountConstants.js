export const TAB_KEYS = {
  core: "core",
  additional: "additional",
  location: "location",
  password: "password",
};

export const TAB_LABELS = {
  [TAB_KEYS.core]: "Core Information",
  [TAB_KEYS.additional]: "Additional Details",
  [TAB_KEYS.location]: "Location Details",
  [TAB_KEYS.password]: "Change Password",
};

export const CORE_FIELDS = ["name", "email"];

export const ADDITIONAL_FIELDS = ["dob", "gender", "height", "weight"];

export const ADDITIONAL_REQUIRED_FIELDS = ["dob", "gender"];

export const LOCATION_FIELDS = [
  "address",
  "country",
  "countryId",
  "state",
  "stateId",
  "city",
  "cityId",
];

export const LOCATION_REQUIRED_FIELDS = ["state", "stateId", "city", "cityId"];
