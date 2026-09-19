const Session = require("../../models/Session");
const response = require("../../config/response");

const unauthorized = (res, message = "Session expired. Please login again.") =>
  response.errorResponse(
    res,
    { msg: message, tokenStatus: 0 },
    message,
    401,
  );

const checkSessionExpiry = async (req, res, next) => {
  try {
    // Soft auth probe (load-user / load-admin): no user means not logged in.
    if (!req.user) {
      return next();
    }

    // Read sessionID from cookies only - no header fallback
    // Determine which cookies to check based on route type
    let sessionID;
    
    // If req.user exists (from auth middleware), use role to determine cookie priority
    // For USER routes (role === 1 or no role): Only read user_sessionID (fallback to sessionID)
    // For ADMIN routes (role === 2 or 3): Only read admin_sessionID (fallback to sessionID)
    const userRole = req.user.role;
    if (userRole === 2 || userRole === 3) {
      // ADMIN/SUBADMIN routes: Only read admin_sessionID
      sessionID = req.cookies?.admin_sessionID;
    } else {
      // USER routes: Only read user_sessionID
      sessionID = req.cookies?.user_sessionID;
    }
    if (!sessionID) {
      return unauthorized(res, "Session expired. Please login again.");
    }

    const session = await Session.findOne({ sessionID });

    if (!session) {
      return response.errorResponse(
        res,
        { msg: "Session expired. Please login again." },
        "Session expired",
        401
      );
    }

    if (
      session.refreshTokenExpiresAt &&
      session.refreshTokenExpiresAt < new Date()
    ) {
      return unauthorized(res, "Session expired. Please login again.");
    }

    next();
  } catch (err) {
    console.error("Session expiry check error:", err);
    next(err);
  }
};

module.exports = { checkSessionExpiry };
