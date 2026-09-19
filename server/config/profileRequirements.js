/**
 * Single source of truth for profile field requirements.
 * Used by API and client (via GET /api/users/profile-requirements).
 */

const FIELD_LABELS = {
  name: "Full Name",
  phone: "Phone",
  email: "Email",
  status: "Account Status",
  dob: "Date of Birth",
  gender: "Gender",
  height: "Height",
  weight: "Weight",
  profile: "Profile Details",
};

/** UI tab keys returned to client for deep-linking into My Account. */
const FIELD_TABS = {
  name: "core",
  email: "core",
  phone: "core",
  dob: "additional",
  gender: "additional",
  height: "additional",
  weight: "additional",
  profile: "core",
};

/** General profile completion (dashboard, most features). */
const PROFILE_USER_REQUIRED = ["email"];

const PROFILE_USER_DETAILS_REQUIRED = ["dob", "gender"];

const getProfileRequirementsResponse = () => ({
  profile: {
    user: PROFILE_USER_REQUIRED,
    userDetails: PROFILE_USER_DETAILS_REQUIRED,
  },
  fieldLabels: FIELD_LABELS,
  fieldTabs: FIELD_TABS,
});

module.exports = {
  getProfileRequirementsResponse,
};
