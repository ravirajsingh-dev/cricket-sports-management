/**
 * Canonical JWT / session role codes.
 *
 * SubAdmin Mongoose documents store a string enum (`admin` | `sub_admin` | …);
 * tokens always use these numeric codes so middleware can branch reliably.
 *
 * @typedef {1 | 2 | 3} JwtRole
 */

/** @type {Readonly<{ USER: 1, ADMIN: 2, SUB_ADMIN: 3 }>} */
const ROLES = Object.freeze({
  USER: 1,
  ADMIN: 2,
  SUB_ADMIN: 3,
});

/**
 * Map a user / admin / sub-admin document to a JWT role code.
 *
 * - Numeric `role` on User (1) or Admin (2) is kept as-is.
 * - Any string `role` (SubAdmin schema) maps to SUB_ADMIN (3).
 * - Missing role defaults to USER (1).
 *
 * @param {{ role?: number | string } | null | undefined} user
 * @returns {JwtRole}
 */
const resolveJwtRole = (user) => {
  if (user?.role === undefined || user?.role === null) {
    return ROLES.USER;
  }
  if (typeof user.role === "number") {
    if (user.role === ROLES.ADMIN) return ROLES.ADMIN;
    if (user.role === ROLES.SUB_ADMIN) return ROLES.SUB_ADMIN;
    return ROLES.USER;
  }
  if (typeof user.role === "string") {
    return ROLES.SUB_ADMIN;
  }
  return ROLES.USER;
};

/**
 * @param {JwtRole | number} role
 * @returns {boolean}
 */
const isStaffRole = (role) =>
  role === ROLES.ADMIN || role === ROLES.SUB_ADMIN;

module.exports = {
  resolveJwtRole,
  isStaffRole,
};
