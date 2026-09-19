const { UserAuth } = require("./auth");

// UserAuth already validates the session (including refresh-token expiry).
// Do not stack checkSessionExpiry here — it was deactivating sessions mid-request
// and causing the next API call to 401 → auto-logout on the client.
const userProtected = [UserAuth];

module.exports = { userProtected };
