/**
 * Lightweight structured logger (JSON lines to stdout/stderr).
 * No external deps — safe for containers / Caddy / DO logs.
 */

const { LOG_LEVEL } = require("../../config/config");

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const currentLevel = () => {
  const raw = String(LOG_LEVEL || "info").toLowerCase();
  return LEVELS[raw] ?? LEVELS.info;
};

const write = (level, message, meta = {}) => {
  if ((LEVELS[level] ?? 99) < currentLevel()) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...meta,
  };
  const out = level === "error" || level === "warn" ? console.error : console.log;
  out(JSON.stringify(line));
};

module.exports = {
  debug: (message, meta) => write("debug", message, meta),
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
};
