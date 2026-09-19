const jwt = require("jsonwebtoken");
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRATION,
  JWT_REFRESH_EXPIRATION,
} = require("../../config/config");

const Session = require("../../models/Session");
const crypto = require("crypto");
const { parseTokenExpiryTime } = require("./helper");
const { logSecurityEvent, EVENT_TYPES, getClientIP } = require("./auditLogger");
const { resolveJwtRole, isStaffRole } = require("./roles");

// Grace window for concurrent requests that still carry a pre-rotation refresh cookie.
const ROTATION_GRACE_MS = 60 * 1000;

const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

const buildTokenPayload = (user, role) => ({
  id: user?._id || user?.id,
  uuid: user?.uuid,
  role,
  passwordChangedAt: user?.passwordChangedAt
    ? new Date(user.passwordChangedAt).getTime()
    : null,
});

const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRATION || "15m",
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION || "1d",
  });
};

const generateTokens = async (user, req = null) => {
  const role = resolveJwtRole(user);
  const userPlainObj = buildTokenPayload(user, role);

  const accessToken = generateAccessToken(userPlainObj);
  const refreshToken = generateRefreshToken(userPlainObj);
  const sessionID = crypto.randomBytes(16).toString("hex");

  let ipAddress = null;
  let userAgent = null;
  if (req) {
    ipAddress = getClientIP(req);
    userAgent = req.headers?.["user-agent"] || null;
  }

  const sessionData = {
    userID: user?._id || user?.id,
    role,
    sessionID,
    refreshTokenHash: hashToken(refreshToken),
    previousRefreshTokenHash: null,
    ipAddress,
    userAgent,
  };

  try {
    const userID = user?._id || user?.id;

    const activeSessions = await Session.find({
      userID: userID,
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .lean();

    const MAX_ACTIVE_SESSIONS = 3;
    if (activeSessions.length >= MAX_ACTIVE_SESSIONS) {
      const sessionsToRemove = activeSessions.length - (MAX_ACTIVE_SESSIONS - 1);
      const sessionIDsToDeactivate = activeSessions
        .slice(0, sessionsToRemove)
        .map((session) => session._id);

      await Session.updateMany(
        { _id: { $in: sessionIDsToDeactivate } },
        { isActive: false },
      );
    }

    await new Session(sessionData).save();

    logSecurityEvent({
      eventType: EVENT_TYPES.SESSION_CREATED,
      status: "success",
      userID: userID?.toString() || null,
      adminID: isStaffRole(role) ? userID?.toString() || null : null,
      details: { role, sessionID },
    });

    return { accessToken, refreshToken, sessionID };
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
};

/**
 * Resolve an active session from cookies. Accepts a stale refresh cookie when
 * another in-flight request already rotated tokens within the grace window.
 */
const resolveSession = async ({ userID, sessionID, refreshToken }) => {
  if (!userID || !sessionID || !refreshToken) {
    return null;
  }

  const session = await Session.findOne({
    userID,
    sessionID,
    isActive: true,
  });

  if (!session) {
    return null;
  }

  // Legacy sessions (raw JWT in refreshToken) are invalid after Phase 1 — force re-login
  if (!session.refreshTokenHash) {
    return null;
  }

  const incomingHash = hashToken(refreshToken);

  if (session.refreshTokenHash === incomingHash) {
    return { session, cookiesNeedSync: false };
  }

  if (
    session.previousRefreshTokenHash &&
    session.previousRefreshTokenHash === incomingHash
  ) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      if (decoded.id?.toString() !== userID.toString()) {
        return null;
      }

      const updatedAt = session.updatedAt
        ? new Date(session.updatedAt).getTime()
        : 0;
      if (Date.now() - updatedAt > ROTATION_GRACE_MS) {
        return null;
      }

      return { session, cookiesNeedSync: true };
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * Rotates refresh token by updating the existing session with new token hashes.
 */
const rotateRefreshToken = async (user, session, expectedRefreshToken = null) => {
  const role = resolveJwtRole(user);
  const userPlainObj = buildTokenPayload(user, role);

  const accessToken = generateAccessToken(userPlainObj);
  const refreshToken = generateRefreshToken(userPlainObj);
  const refreshTokenExpiresAt = new Date(
    Date.now() + parseTokenExpiryTime(JWT_REFRESH_EXPIRATION || "1d"),
  );
  const newHash = hashToken(refreshToken);
  const expectedHash = expectedRefreshToken
    ? hashToken(expectedRefreshToken)
    : session.refreshTokenHash;
  const graceCutoff = new Date(Date.now() - ROTATION_GRACE_MS);

  try {
    const updatedSession = await Session.findOneAndUpdate(
      {
        _id: session._id,
        isActive: true,
        $or: [
          { refreshTokenHash: expectedHash },
          {
            previousRefreshTokenHash: expectedHash,
            updatedAt: { $gte: graceCutoff },
          },
        ],
      },
      {
        $set: {
          previousRefreshTokenHash: session.refreshTokenHash,
          refreshTokenHash: newHash,
          refreshTokenExpiresAt,
        },
        $unset: {
          // Drop legacy raw token fields if present
          accessToken: "",
          refreshToken: "",
        },
      },
      { returnDocument: "after" },
    );

    if (updatedSession) {
      return {
        accessToken,
        refreshToken,
        sessionID: updatedSession.sessionID,
        rotated: true,
      };
    }

    const currentSession = await Session.findOne({
      _id: session._id,
      isActive: true,
    });

    if (!currentSession) {
      throw new Error("Session is no longer active");
    }

    // Another request won the race — mint a fresh pair for this client if still in grace
    const retryAccess = generateAccessToken(userPlainObj);
    const retryRefresh = generateRefreshToken(userPlainObj);
    const retryHash = hashToken(retryRefresh);

    const raced = await Session.findOneAndUpdate(
      {
        _id: session._id,
        isActive: true,
        updatedAt: { $gte: graceCutoff },
      },
      {
        $set: {
          previousRefreshTokenHash: currentSession.refreshTokenHash,
          refreshTokenHash: retryHash,
          refreshTokenExpiresAt: new Date(
            Date.now() + parseTokenExpiryTime(JWT_REFRESH_EXPIRATION || "1d"),
          ),
        },
      },
      { returnDocument: "after" },
    );

    if (!raced) {
      throw new Error("Session rotation race lost");
    }

    return {
      accessToken: retryAccess,
      refreshToken: retryRefresh,
      sessionID: raced.sessionID,
      rotated: true,
    };
  } catch (error) {
    console.error("Error rotating refresh token:", error);
    throw error;
  }
};

module.exports = {
  generateTokens,
  rotateRefreshToken,
  resolveSession,
};
