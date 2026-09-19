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
