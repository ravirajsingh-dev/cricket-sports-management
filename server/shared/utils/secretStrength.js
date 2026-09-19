/**
 * Boot-time secret strength checks for JWT signing keys.
 */

const MIN_SECRET_LENGTH = 32;
const WEAK_FRAGMENTS = [
  "change-me",
  "changeme",
  "secret",
  "password",
  "example",
  "test",
  "todo",
];

/**
 * @param {string} name
 * @param {string | undefined} value
 * @param {{ minLength?: number, allowWeakInDev?: boolean }} [opts]
 * @returns {{ ok: boolean, errors: string[] }}
 */
const evaluateSecret = (name, value, opts = {}) => {
  const minLength = opts.minLength ?? MIN_SECRET_LENGTH;
  const errors = [];
  const raw = String(value ?? "");

  if (!raw) {
    errors.push(`${name} is missing`);
    return { ok: false, errors };
  }
  if (raw.length < minLength) {
    errors.push(
      `${name} must be at least ${minLength} characters (got ${raw.length})`,
    );
  }

  const lower = raw.toLowerCase();
  const looksWeak = WEAK_FRAGMENTS.some((frag) => lower.includes(frag));
  if (looksWeak && !opts.allowWeakInDev) {
    errors.push(
      `${name} looks like a placeholder or weak value; generate a long random secret`,
    );
  }

  return { ok: errors.length === 0, errors };
};

/**
 * Validate JWT secrets for the current NODE_ENV.
 * In development/test, length is still enforced but weak-fragment warnings
 * become non-fatal unless `strict` is true.
 *
 * @param {{ JWT_ACCESS_SECRET?: string, JWT_REFRESH_SECRET?: string, NODE_ENV?: string }} env
 * @param {{ strict?: boolean }} [opts]
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
const validateJwtSecrets = (env, opts = {}) => {
  const nodeEnv = env.NODE_ENV || "development";
  const isProd = nodeEnv === "production";
  const strict = opts.strict === true || isProd;
  const allowWeakInDev = !strict;

  const access = evaluateSecret(
    "JWT_ACCESS_SECRET",
    env.JWT_ACCESS_SECRET,
    { allowWeakInDev },
  );
  const refresh = evaluateSecret(
    "JWT_REFRESH_SECRET",
    env.JWT_REFRESH_SECRET,
    { allowWeakInDev },
  );

  const errors = [...access.errors, ...refresh.errors];
  const warnings = [];

  if (
    env.JWT_ACCESS_SECRET &&
    env.JWT_REFRESH_SECRET &&
    env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET
  ) {
    const msg =
      "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values";
    if (strict) errors.push(msg);
    else warnings.push(msg);
  }

  return { ok: errors.length === 0, errors, warnings };
};

module.exports = {
  validateJwtSecrets,
};
