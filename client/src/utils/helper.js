export const handleNumberInput = (event) => {
  const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight"];

  if (!/[0-9]/.test(event.key) && !allowedKeys.includes(event.key)) {
    event.preventDefault();
  }
};

/** Normalize API errors to an array (matches admin helper). */
export const normalizeErrors = (errors) => {
  if (!errors) return [];
  if (Array.isArray(errors)) return errors;
  if (typeof errors === "object") return [errors];
  return [{ msg: String(errors) }];
};
