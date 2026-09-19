/**
 * Normalize API / axios failures for admin UI handlers.
 * @param {unknown} err
 * @param {string} [fallback]
 */
export const normalizeApiError = (
  err,
  fallback = "An error occurred. Please try again.",
) => {
  const data = err?.response?.data;
  const errors = Array.isArray(data?.errors) ? data.errors : [];
  const raw =
    data?.message ||
    data?.msg ||
    errors[0]?.msg ||
    err?.message ||
    err?.response?.statusText ||
    fallback;

  const message =
    typeof raw === "string" && raw.trim() && raw.length < 280
      ? raw.trim()
      : fallback;

  return {
    message,
    errors,
    tokenStatus: data?.tokenStatus,
    status: err?.response?.status,
  };
};
