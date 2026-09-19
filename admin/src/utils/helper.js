export const isAdmin = (user) => {
  return user && (user.role === 2 || (typeof user.role === "number" && user.role === 2)) ? true : false;
};

const isSubAdmin = (user) => {
  return user && (user.role === 3 || (typeof user.role === "number" && user.role === 3) || user.isSubAdmin) ? true : false;
};

export const isAdminOrSubAdmin = (user) => {
  return isAdmin(user) || isSubAdmin(user);
};

/**
 * Normalize errors to always be an array
 * Handles both array and object error formats from backend
 * @param {Array|Object|string|undefined} errors - Error data from API response
 * @returns {Array} Array of error objects with msg and optional path
 */
export const normalizeErrors = (errors) => {
  if (!errors) return [];
  
  if (Array.isArray(errors)) {
    return errors;
  }
  
  if (typeof errors === 'object') {
    // If it's an object like { msg: "..." }, convert to array
    return [errors];
  }
  
  // If it's a string or other value, convert to array with msg property
  return [{ msg: String(errors) }];
};
