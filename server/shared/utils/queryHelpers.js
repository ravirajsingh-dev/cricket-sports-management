const { escapeRegex } = require("./searchHelper");

/**
 * Case-insensitive exact match for MongoDB queries.
 * Escapes regex metacharacters so user input cannot inject patterns.
 * @param {string} value
 * @returns {{ $regex: string, $options: string }}
 */
const exactMatchCI = (value) => ({
  $regex: `^${escapeRegex(String(value ?? "").trim())}$`,
  $options: "i",
});

/**
 * Normalize admin IDs to uppercase for exact $eq lookups (stored uppercase).
 * @param {string} value
 * @returns {string}
 */
const normalizeAdminId = (value) => String(value ?? "").trim().toUpperCase();

module.exports = {
  exactMatchCI,
  normalizeAdminId,
};
