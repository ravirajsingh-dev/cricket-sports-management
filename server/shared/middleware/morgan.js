const morgan = require("morgan");
const logger = require("../utils/logger");

/**
 * HTTP access logging via morgan → structured logger.
 * (Legacy Mongo Log path removed — responseBody was never wired.)
 */
morgan.token("requester", (req) => {
  if (req.cookies?.admin_token || req.cookies?.admin_sessionID) return "Admin";
  if (req.cookies?.user_token || req.cookies?.user_sessionID) return "User";
  return "Public";
});

const stream = {
  write: (message) => {
    logger.info(message.trim(), { type: "http" });
  },
};

const morganMiddleware = morgan(
  ':requester :remote-addr ":method :url" :status :res[content-length] :response-time ms',
  { stream },
);

module.exports = morganMiddleware;
