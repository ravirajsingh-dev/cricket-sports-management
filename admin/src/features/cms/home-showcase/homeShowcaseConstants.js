export const IMPACT_ICON_OPTIONS = [
  { value: "trophy", label: "Trophy / Prize" },
  { value: "map-pin", label: "Location / Cities" },
  { value: "pulse", label: "Trials / Live" },
  { value: "users", label: "People / Ages" },
  { value: "target", label: "Target / Mark" },
  { value: "shield", label: "Fair / Scorecard" },
  { value: "check", label: "Check / Verified" },
  { value: "medal", label: "Medal" },
  { value: "cricket", label: "Cricket" },
  { value: "handshake", label: "Partnership" },
];

const IMPACT_ICON_PRIORITY = IMPACT_ICON_OPTIONS.map((option) => option.value);

/** Icons still free for a given item (current icon stays available). */
export const getAvailableImpactIconOptions = (
  items = [],
  currentIndex = -1,
) => {
  const used = new Set(
    items
      .map((item, index) =>
        index === currentIndex ? null : item?.icon || null,
      )
      .filter(Boolean),
  );

  return IMPACT_ICON_OPTIONS.filter((option) => !used.has(option.value));
};

/**
 * Pick a meaningful unused icon from label/value text.
 * @param {string} label
 * @param {string} value
 * @param {string[]} [usedIcons]
 */
export const suggestImpactIcon = (label = "", value = "", usedIcons = []) => {
  const used = new Set((usedIcons || []).filter(Boolean));
  const haystack = `${label} ${value}`.toLowerCase();

  const rules = [
    { icon: "trophy", keys: ["prize", "pool", "trophy", "money", "rupee", "₹", "cr", "purse", "award"] },
    { icon: "map-pin", keys: ["city", "cities", "location", "venue", "ground city", "trial cit"] },
    { icon: "pulse", keys: ["on-ground", "onground", "ground trial", "live", "pulse", "heart", "fitness"] },
    { icon: "users", keys: ["age", "ages", "u-16", "u-19", "u-24", "player", "people", "team", "group", "youth"] },
    { icon: "target", keys: ["selection mark", "mark", "target", "run", "runs", "14 run"] },
    { icon: "shield", keys: ["scorecard", "bias", "fair", "transparent", "honest", "shield", "0 bias"] },
    { icon: "check", keys: ["check", "verified", "approve", "qualify"] },
    { icon: "medal", keys: ["medal", "winner", "champion", "star", "rating"] },
    { icon: "cricket", keys: ["cricket", "bat", "ball", "match"] },
    { icon: "handshake", keys: ["partner", "sponsor", "handshake", "deal"] },
  ];

  for (const rule of rules) {
    if (
      !used.has(rule.icon) &&
      rule.keys.some((key) => haystack.includes(key))
    ) {
      return rule.icon;
    }
  }

  const fallback = IMPACT_ICON_PRIORITY.find((icon) => !used.has(icon));
  return fallback || "trophy";
};

export const MAX_IMPACT_ITEMS = 10;
export const TITLE_MAX_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 200;

export const newItemId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const emptySelectorBadge = () => ({
  id: newItemId("badge"),
  label: "",
  direction: "ltr",
});

export const BADGE_DIRECTION_OPTIONS = [
  { label: "Left → Right", value: "ltr" },
  { label: "Right → Left", value: "rtl" },
];

export const toBadgeSelectOptions = (badges = []) =>
  (badges || [])
    .filter((badge) => badge?.id && String(badge.label || "").trim())
    .map((badge) => ({
      value: badge.id,
      label: String(badge.label).trim().toUpperCase(),
    }));
