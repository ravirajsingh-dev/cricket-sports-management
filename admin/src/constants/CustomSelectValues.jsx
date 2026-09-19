export const UserStatuses = [
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
  { label: "Temporary Blocked", value: 3 },
  { label: "New", value: 4 },
];

export const getStatusOptionByValue = (value) =>
  UserStatuses.find((item) => Number(item.value) === Number(value)) || null;

export const GenderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

export const getOptionByValue = (options, value) => {
  if (value == null || value === "") return null;
  return (
    options.find((item) => String(item.value) === String(value)) || {
      label: String(value),
      value: String(value),
    }
  );
};

export const SubAdminRoleOptions = [
  { value: "sub_admin", label: "Sub Admin" },
  { value: "staff", label: "Staff" },
  { value: "manager", label: "Manager" },
];
