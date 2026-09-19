/** Maps CustomSelect option to a synthetic change event for form state. */
export const formSelectFieldChange =
  (name, onChange, { stringify = false } = {}) =>
  (option) => {
    const raw = option?.value;
    const value =
      raw == null || raw === "" ? "" : stringify ? String(raw) : raw;
    onChange({ target: { name, value } });
  };

export const INITIAL_FORM_DATA = {
  name: "",
  phone: "",
  email: "",
  password: "",
  status: "",
  country: "India",
  countryId: 101,
  state: "",
  stateId: "",
  city: "",
  cityId: "",
  address: "",
  dob: "",
  gender: "",
  height: "",
  weight: "",
};

export const buildFormDataFromUser = (user) => {
  const userDetails = user.userDetails || {};

  return {
    name: user.name || "",
    phone: user.phone || "",
    email: user.email || "",
    status:
      user.status !== undefined && user.status !== null
        ? String(user.status)
        : "",
    country: user.country || "India",
    countryId: user.countryId || 101,
    state: user.state || "",
    stateId: user.stateId || "",
    city: user.city || "",
    cityId: user.cityId || "",
    address: user.address || "",
    dob: userDetails.dob
      ? new Date(userDetails.dob).toISOString().split("T")[0]
      : "",
    gender: userDetails.gender || "",
    height:
      userDetails.height != null && userDetails.height !== ""
        ? String(userDetails.height)
        : "",
    weight:
      userDetails.weight != null && userDetails.weight !== ""
        ? String(userDetails.weight)
        : "",
    password: "",
  };
};
