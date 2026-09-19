import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaVideo,
  FaLinkedinIn,
  FaWhatsapp,
  FaTelegram,
  FaTiktok,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const SOCIAL_PLATFORM_ICONS = {
  facebook: { icon: FaFacebookF, label: "Facebook" },
  instagram: { icon: FaInstagram, label: "Instagram" },
  youtube: { icon: FaYoutube, label: "YouTube" },
  twitter: { icon: FaXTwitter, label: "X (Twitter)" },
  linkedin: { icon: FaLinkedinIn, label: "LinkedIn" },
  whatsapp: { icon: FaWhatsapp, label: "WhatsApp" },
  telegram: { icon: FaTelegram, label: "Telegram" },
  zoom: { icon: FaVideo, label: "Zoom Meeting" },
  tiktok: { icon: FaTiktok, label: "TikTok" },
};

/** Prefer socialMedia.links[] only (flat legacy keys removed in Phase 5). */
export const normalizeSocialLinks = (socialMedia = {}) => {
  if (!Array.isArray(socialMedia.links) || socialMedia.links.length === 0) {
    return [];
  }
  return socialMedia.links
    .filter((link) => link?.url && String(link.url).trim())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const getPlatformIcon = (platform) =>
  SOCIAL_PLATFORM_ICONS[platform]?.icon || SOCIAL_PLATFORM_ICONS.facebook.icon;

export const getPlatformLabel = (platform) =>
  SOCIAL_PLATFORM_ICONS[platform]?.label || platform;

export const hasSocialLinks = (socialMedia = {}) =>
  normalizeSocialLinks(socialMedia).length > 0;
