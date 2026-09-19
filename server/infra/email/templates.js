const config = require("../../config/config");

/**
 * Email Templates
 *
 * Purpose: Centralized email templates and subjects
 * Branding: Raghukul Sevak Foundation ($theme-ltcl)
 * Messaging: Aligned with About Us mission and vision copy
 */

/** LTCL theme tokens (from client/src/assets/scss/variables.scss — $theme-ltcl) */
const THEME = {
  primary: "#c29e66",
  secondary: "#d1b58a",
  success: "#4f8a4d",
  warning: "#e67e22",
  danger: "#e04e1a",
  bgDeep: "#120f0d",
  surface: "#191715",
  cream: "#f5e6c8",
  muted: "#bdb39c",
  pageBg: "#f3ebe0",
  cardBg: "#ffffff",
  text: "#2a241c",
  textMuted: "#6b6358",
  border: "#e8dfd0",
  noticeBg: "#faf6ef",
  softBox: "#f8f4ec",
};

/** Brand copy from live CMS (hero, mission, vision) */
const BRAND = {
  tagline: "Sanskar * Seva * Samarpan",

  missionFocus:
    "Working towards environmental conservation, women empowerment, youth development, animal welfare, and community well-being through meaningful social initiatives.",

  visionShort:
    "Building a greener, stronger, and more compassionate society for future generations.",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const displayAppName = (appName) =>
  escapeHtml(appName || "Raghukul Sevak Foundation");

/** Theme-colored brand name (inline for email-client safety) */
const brandNameHtml = (appName) =>
  `<span style="color:${THEME.primary};font-weight:700;">${displayAppName(appName)}</span>`;

/** Theme-colored personal name */
const personNameHtml = (name, fallback = "Member") =>
  `<span style="color:${THEME.primary};font-weight:700;">${escapeHtml(name || fallback)}</span>`;

/** Theme-colored credential / ID value */
const credentialHtml = (value) =>
  `<span style="color:${THEME.bgDeep};font-weight:700;font-family:'Courier New',Courier,monospace;background-color:${THEME.cream};padding:2px 8px;border-radius:4px;letter-spacing:0.02em;">${escapeHtml(value || "—")}</span>`;

const getSharedStyles = (accent = THEME.primary) => `
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    line-height: 1.65;
    color: ${THEME.text};
    background-color: ${THEME.pageBg};
  }
  .email-outer {
    background-color: ${THEME.pageBg};
    padding: 28px 12px;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: ${THEME.cardBg};
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid ${THEME.border};
  }
  .header {
    text-align: center;
    padding: 28px 24px 24px;
    background: linear-gradient(160deg, ${THEME.bgDeep} 0%, ${THEME.surface} 100%);
  }
  .header h1 {
    margin: 0;
    font-size: 20px;
    letter-spacing: 0.06em;
    color: ${THEME.primary};
    font-weight: 700;
    font-family: Georgia, "Times New Roman", serif;
    text-transform: uppercase;
  }
  .header-accent {
    width: 48px;
    height: 3px;
    background-color: ${THEME.primary};
    margin: 14px auto 0;
    border-radius: 2px;
  }
  .content {
    padding: 30px 28px 12px;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 15px;
    color: ${THEME.text};
  }
  .content p {
    margin: 0 0 14px;
  }
  .highlight {
    font-size: 18px;
    font-weight: 700;
    color: ${accent};
    margin: 6px 0 18px;
    text-align: center;
    font-family: Georgia, "Times New Roman", serif;
  }
  .info-box {
    background-color: ${THEME.softBox};
    padding: 18px 20px;
    border-radius: 10px;
    margin: 18px 0;
    border-left: 4px solid ${accent};
  }
  .info-box h3 {
    margin: 0 0 12px;
    color: ${THEME.bgDeep};
    font-size: 15px;
  }
  .detail-row {
    padding: 10px 0;
    border-bottom: 1px solid ${THEME.border};
    font-size: 14px;
  }
  .detail-row:last-child {
    border-bottom: none;
  }
  .detail-label {
    font-weight: 700;
    color: ${THEME.textMuted};
    display: inline-block;
    min-width: 120px;
  }
  .detail-value {
    color: ${THEME.text};
  }
  .amount {
    font-size: 22px;
    font-weight: 700;
    color: ${THEME.success};
  }
  .badge {
    display: inline-block;
    background-color: ${accent};
    color: #ffffff;
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.04em;
    margin-top: 12px;
  }
  .notice {
    background-color: ${THEME.noticeBg};
    border-left: 4px solid ${THEME.primary};
    padding: 14px 16px;
    margin: 18px 0;
    border-radius: 6px;
    font-size: 14px;
  }
  .notice-warn {
    background-color: #fff8f0;
    border-left: 4px solid ${THEME.warning};
  }
  .notice-danger {
    background-color: #fff5f2;
    border-left: 4px solid ${THEME.danger};
  }
  .otp-code {
    font-size: 34px;
    font-weight: 700;
    color: ${THEME.primary};
    letter-spacing: 10px;
    margin: 12px 0;
    font-family: "Courier New", Courier, monospace;
    text-align: center;
  }
  .expiry {
    color: ${THEME.danger};
    font-weight: 700;
    font-size: 13px;
    text-align: center;
  }
  .cta {
    display: inline-block;
    margin: 8px 0 16px;
    padding: 13px 26px;
    background-color: ${THEME.primary};
    color: ${THEME.bgDeep} !important;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
  }
  .footer {
    text-align: center;
    padding: 22px 28px 26px;
    border-top: 1px solid ${THEME.border};
    background-color: ${THEME.noticeBg};
    color: ${THEME.textMuted};
    font-size: 13px;
    font-family: Arial, Helvetica, sans-serif;
    line-height: 1.7;
  }
  .footer p {
    margin: 0 0 4px;
  }
  .footer .sign-off {
    color: ${THEME.text};
    margin-bottom: 2px;
  }
  .footer .team-name {
    color: ${THEME.primary};
    font-weight: 700;
    margin-bottom: 4px;
  }
  .footer .tagline {
    color: ${THEME.secondary};
    font-style: italic;
    letter-spacing: 0.04em;
    margin: 0 0 16px;
  }
  .footer .contact {
    margin: 0 0 10px;
  }
  .footer .copyright {
    margin: 0;
    font-size: 12px;
  }
  .footer a {
    color: ${THEME.primary};
    font-weight: 700;
    text-decoration: none;
  }
`;

const renderHeader = (appName) => `
  <div class="header" style="text-align:center;padding:28px 24px 24px;background-color:${THEME.bgDeep};">
    <h1 style="margin:0;font-size:20px;letter-spacing:0.06em;color:${THEME.primary};font-weight:700;font-family:Georgia,'Times New Roman',serif;text-transform:uppercase;">${displayAppName(appName)}</h1>
    <div class="header-accent" style="width:48px;height:3px;background-color:${THEME.primary};margin:14px auto 0;border-radius:2px;"></div>
  </div>
`;

const renderFooter = (appName) => {
  const org = displayAppName(appName);
  const year = new Date().getFullYear();
  const contact = escapeHtml(config.MAIL_FROM_ADDRESS);

  return `
  <div class="footer" style="text-align:center;padding:22px 28px 26px;border-top:1px solid ${THEME.border};background-color:${THEME.noticeBg};color:${THEME.textMuted};font-size:13px;font-family:Arial,Helvetica,sans-serif;line-height:1.7;">
    <p class="sign-off" style="margin:0 0 2px;color:${THEME.text};">Thank you,</p>
    <p class="team-name" style="margin:0 0 4px;color:${THEME.primary};font-weight:700;">The ${org} Team</p>
    <p class="tagline" style="margin:0 0 16px;color:${THEME.secondary};font-style:italic;letter-spacing:0.04em;">${BRAND.tagline}</p>
    <p class="contact" style="margin:0 0 10px;">For queries, contact us at:
      <a href="mailto:${contact}" style="color:${THEME.primary};font-weight:700;text-decoration:none;">${contact}</a>
    </p>
    <p class="copyright" style="margin:0;font-size:12px;">&copy; ${year} ${org}. All rights reserved.</p>
  </div>
`;
};

const wrapEmail = ({ title, appName, bodyHtml, accent }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
  <style>${getSharedStyles(accent)}</style>
</head>
<body style="margin:0;padding:0;background-color:${THEME.pageBg};">
  <div class="email-outer" style="background-color:${THEME.pageBg};padding:28px 12px;">
    <div class="container" style="max-width:600px;margin:0 auto;background-color:${THEME.cardBg};border-radius:14px;overflow:hidden;border:1px solid ${THEME.border};">
      ${renderHeader(appName)}
      <div class="content" style="padding:30px 28px 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${THEME.text};">
        ${bodyHtml}
      </div>
      ${renderFooter(appName)}
    </div>
  </div>
</body>
</html>
`;

/**
 * Forgot-password OTP email
 */
const getForgotPasswordOtpTemplate = ({
  name,
  otp,
  expiryMinutes,
  appName,
}) => {
  const org = brandNameHtml(appName);
  const bodyHtml = `
    <p>Hello ${personNameHtml(name)},</p>

    <p>We received a request to reset the password for your ${org} account. Use the one-time password below to verify your identity and continue securely.</p>

    <div class="info-box" style="text-align:center;background-color:${THEME.softBox};padding:18px 20px;border-radius:10px;margin:18px 0;border-left:4px solid ${THEME.primary};">
      <p style="margin:0 0 4px;color:${THEME.textMuted};font-size:13px;">Your password reset OTP</p>
      <div class="otp-code" style="font-size:34px;font-weight:700;color:${THEME.primary};letter-spacing:10px;margin:12px 0;font-family:'Courier New',Courier,monospace;text-align:center;">${escapeHtml(otp)}</div>
      <p class="expiry" style="color:${THEME.danger};font-weight:700;font-size:13px;text-align:center;">This OTP expires in ${escapeHtml(String(expiryMinutes))} minutes.</p>
    </div>

    <div class="notice notice-warn" style="background-color:#fff8f0;border-left:4px solid ${THEME.warning};padding:14px 16px;margin:18px 0;border-radius:6px;font-size:14px;">
      <strong>Security notice:</strong> If you did not request a password reset, you can safely ignore this email. Your account remains secure.
    </div>

    <p>Do not share this OTP with anyone. Our team will never ask for your OTP or password.</p>
  `;

  return wrapEmail({
    title: `Password Reset OTP${appName ? ` | ${appName}` : ""}`,
    appName,
    bodyHtml,
    accent: THEME.primary,
  });
};

/**
 * Welcome email — ACTIVE members (registration complete)
 */
const getActiveUserWelcomeTemplate = ({
  name,
  memberId,
  appName,
}) => {
  const org = brandNameHtml(appName);
  const bodyHtml = `
    <p>Dear ${personNameHtml(name)},</p>

    <div class="highlight" style="font-size:18px;font-weight:700;color:${THEME.success};margin:6px 0 18px;text-align:center;font-family:Georgia,'Times New Roman',serif;">Welcome — your registration is complete</div>

    <p>Your account is now <strong style="color:${THEME.success};">ACTIVE</strong>. You are a valued member of ${org}. We are glad to have you with us.</p>

    <div class="info-box" style="background-color:${THEME.softBox};padding:18px 20px;border-radius:10px;margin:18px 0;border-left:4px solid ${THEME.success};">
      <h3 style="margin:0 0 12px;color:${THEME.bgDeep};font-size:15px;">Your login details</h3>
      <div class="detail-row" style="padding:10px 0;border-bottom:1px solid ${THEME.border};font-size:14px;">
        <span class="detail-label" style="font-weight:700;color:${THEME.textMuted};display:inline-block;min-width:120px;">Member ID</span>
        <span class="detail-value">${credentialHtml(memberId)}</span>
      </div>
      <div class="detail-row" style="padding:10px 0;border-bottom:1px solid ${THEME.border};font-size:14px;">
        <span class="detail-label" style="font-weight:700;color:${THEME.textMuted};display:inline-block;min-width:120px;">Password</span>
        <span class="detail-value">The password you created during registration</span>
      </div>
      <div class="badge" style="display:inline-block;background-color:${THEME.success};color:#fff;padding:6px 14px;border-radius:20px;font-weight:700;font-size:12px;letter-spacing:0.04em;margin-top:12px;">Status: ACTIVE</div>
    </div>

    <p>Log in with your Member ID and the password you chose to explore the portal.</p>

    <div class="notice" style="background-color:${THEME.noticeBg};border-left:4px solid ${THEME.primary};padding:14px 16px;margin:18px 0;border-radius:6px;font-size:14px;">
      <strong>Security tip:</strong> Keep your credentials private. Never share your password. Use Forgot Password (email OTP) if you need to reset it.
    </div>

    <p>${BRAND.visionShort}</p>
  `;

  return wrapEmail({
    title: `Welcome to ${appName || "Raghukul Sevak Foundation"} | Registration Complete`,
    appName,
    bodyHtml,
    accent: THEME.success,
  });
};

/**
 * Email subjects (clear, brand-prefixed for inbox SEO)
 * @param {string} appName
 * @param {string} [_appAbbreviation]
 * @returns {Object}
 */
const getSubjects = (appName, _appAbbreviation) => {
  const brand = appName || "Raghukul Sevak Foundation";
  return {
    FORGOT_PASSWORD_OTP: `Your Password Reset OTP | ${brand}`,
    ACTIVE_USER_WELCOME: `Welcome — Registration Complete | ${brand}`,
  };
};

module.exports = {
  getForgotPasswordOtpTemplate,
  getActiveUserWelcomeTemplate,
  getSubjects,
};
