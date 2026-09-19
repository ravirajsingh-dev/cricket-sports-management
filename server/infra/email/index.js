/**
 * Email Service Module
 *
 * Purpose: Main entry point for email functionality
 *
 * Architecture:
 * - brevoClient.js: Low-level Brevo API HTTP client
 * - emailService.js: High-level email sending service
 * - templates.js: Email templates and subjects
 *
 * Usage:
 *   const emailService = require('./services/email');
 *
 *   // Send generic email
 *   await emailService.sendEmail({
 *     to: 'user@example.com',
 *     subject: 'Welcome',
 *     html: '<h1>Welcome!</h1>'
 *   });
 */

const emailService = require("./emailService");
const templates = require("./templates");
const brevoClient = require("./brevoClient");
const CommonSettings = require("../../models/CommonSettings");

/**
 * Fetch brand settings used by email templates
 * @returns {Promise<{appName: string, appAbbreviation: string}>}
 */
const getEmailBrandSettings = async () => {
  try {
    const settings = await CommonSettings.getOrCreateSettings();
    return {
      appName: settings.name || "",
      appAbbreviation: settings.abbreviation || "",
    };
  } catch (error) {
    console.error("Error fetching settings for email template:", error);
    return { appName: "", appAbbreviation: "" };
  }
};

/**
 * Send forgot password OTP email
 * @param {Object} otpRequest - OTP request data
 * @param {string} otpRequest.name - User name
 * @param {string} otpRequest.email - User email
 * @param {string} otpRequest.otp - 6-digit OTP
 * @param {number} otpRequest.expiryMinutes - OTP expiry time in minutes
 * @returns {Promise<Object>} Email sending result
 */
const sendForgotPasswordOtpEmail = async (otpRequest) => {
  const { name, email, otp, expiryMinutes } = otpRequest;

  const { appName, appAbbreviation } = await getEmailBrandSettings();

  const html = templates.getForgotPasswordOtpTemplate({
    name,
    otp,
    expiryMinutes,
    appName,
  });

  const subjects = templates.getSubjects(appName, appAbbreviation);

  return await emailService.sendEmail({
    to: email,
    subject: subjects.FORGOT_PASSWORD_OTP,
    html: html,
  });
};

/**
 * Send welcome email for ACTIVE users (registration complete)
 * @param {Object} welcomeRequest - Welcome email request data
 * @param {string} welcomeRequest.name - User name
 * @param {string} welcomeRequest.email - User email
 * @param {string} welcomeRequest.memberId - User Member ID
 * @returns {Promise<Object>} Email sending result
 */
const sendActiveUserWelcomeEmail = async (welcomeRequest) => {
  const { name, email, memberId } = welcomeRequest;

  if (!email) {
    return { success: false, error: "User email is required" };
  }

  const { appName, appAbbreviation } = await getEmailBrandSettings();

  const html = templates.getActiveUserWelcomeTemplate({
    name: name || "User",
    memberId,
    appName,
  });

  const subjects = templates.getSubjects(appName, appAbbreviation);

  return await emailService.sendEmail({
    to: email,
    subject: subjects.ACTIVE_USER_WELCOME,
    html: html,
  });
};

module.exports = {
  sendForgotPasswordOtpEmail,
  sendActiveUserWelcomeEmail,
  verifyConnection: brevoClient.verifyConnection,
};
