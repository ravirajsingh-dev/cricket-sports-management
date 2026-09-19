/**
 * Pure CORS origin decision (unit-tested; no env/config side effects).
 * @param {string|undefined} origin
 * @param {{ allowedOriginsCsv?: string, nodeEnv?: string }} opts
 * @returns {{ allow: true } | { allow: false, error: string }}
 */
const evaluateCorsOrigin = (
  origin,
  { allowedOriginsCsv = "", nodeEnv = "development" } = {},
) => {
  if (!origin) {
    if (nodeEnv === "production") {
      return { allow: false, error: "CORS: Origin required in production" };
    }
    return { allow: true };
  }

  const origins =
    allowedOriginsCsv?.split(",").map((item) => item.trim()).filter(Boolean) ||
    [];

  if (origins.length === 0) {
    return { allow: false, error: "CORS: No allowed origins configured" };
  }

  if (origins.includes(origin)) {
    return { allow: true };
  }

  return { allow: false, error: "Not allowed by CORS" };
};

module.exports = { evaluateCorsOrigin };
