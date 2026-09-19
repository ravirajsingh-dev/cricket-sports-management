const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "youtube",
  "twitter",
  "linkedin",
  "whatsapp",
  "telegram",
  "zoom",
  "tiktok",
];

const normalizeLink = (link, index) => ({
  id: String(link?.id || "").trim() || `link_${index}`,
  platform: String(link?.platform || "facebook").trim().toLowerCase(),
  url: String(link?.url || "").trim(),
  order: typeof link?.order === "number" ? link.order : index,
});

/** Normalize social media to links[] only (legacy flat keys removed in Phase 5). */
const normalizeSocialMediaLinks = (socialMedia = {}) => {
  const raw = socialMedia?.toObject ? socialMedia.toObject() : socialMedia || {};
  if (!Array.isArray(raw.links) || raw.links.length === 0) {
    return [];
  }
  return raw.links
    .map(normalizeLink)
    .filter((link) => link.url)
    .sort((a, b) => a.order - b.order);
};

const sanitizeSocialMediaLinks = (links = []) => {
  if (!Array.isArray(links)) {
    return [];
  }

  return links
    .map((link, index) => {
      const platform = String(link?.platform || "facebook")
        .trim()
        .toLowerCase();
      const url = String(link?.url || "").trim();
      if (!url) {
        return null;
      }
      return {
        id: String(link?.id || "").trim() || `link_${Date.now()}_${index}`,
        platform: SOCIAL_PLATFORMS.includes(platform) ? platform : "facebook",
        url,
        order: index,
      };
    })
    .filter(Boolean);
};

module.exports = {
  normalizeSocialMediaLinks,
  sanitizeSocialMediaLinks,
};
