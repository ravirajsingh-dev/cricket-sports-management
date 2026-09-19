export const TAB_KEYS = {
  core: "core",
  additional: "additional",
  location: "location",
};

export const TAB_LABELS = {
  [TAB_KEYS.core]: "Core Information",
  [TAB_KEYS.additional]: "Additional Details",
  [TAB_KEYS.location]: "Location Details",
};

export const ADDITIONAL_REQUIRED_FIELDS = ["dob", "gender"];

export const CORE_FIELDS = ["name", "phone", "email", "status", "password"];

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

/** Server-aligned lengths for client validation (User + UserDetails schemas). */
export const FIELD_CONSTRAINTS = {
  name: { minLength: 3, maxLength: 50 },
  password: { minLength: 6, maxLength: 128 },
  address: { maxLength: 500 },
};

export const ADDITIONAL_FIELDS = ["dob", "gender", "height", "weight"];
