const IMPACT_ICON_VALUES = [
  "trophy",
  "map-pin",
  "pulse",
  "users",
  "target",
  "shield",
  "check",
  "star",
  "medal",
  "cricket",
  "handshake",
];

const MAX_IMPACT_ITEMS = 10;

const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 200;

const suggestImpactIcon = (label = "", value = "", usedIcons = []) => {
  const used = new Set((usedIcons || []).filter(Boolean));
  const haystack = `${label} ${value}`.toLowerCase();
  const rules = [
    { icon: "trophy", keys: ["prize", "pool", "trophy", "money", "rupee", "₹", "cr", "purse", "award"] },
    { icon: "map-pin", keys: ["city", "cities", "location", "venue", "trial cit"] },
    { icon: "pulse", keys: ["on-ground", "onground", "ground trial", "live", "pulse", "heart", "fitness"] },
    { icon: "users", keys: ["age", "ages", "u-16", "u-19", "u-24", "player", "people", "team", "group", "youth"] },
    { icon: "target", keys: ["selection mark", "mark", "target", "run", "runs", "14 run"] },
    { icon: "shield", keys: ["scorecard", "bias", "fair", "transparent", "honest", "shield", "0 bias"] },
    { icon: "check", keys: ["check", "verified", "approve", "qualify"] },
    { icon: "medal", keys: ["medal", "winner", "champion"] },
    { icon: "cricket", keys: ["cricket", "bat", "ball", "match"] },
    { icon: "handshake", keys: ["partner", "sponsor", "handshake", "deal"] },
    { icon: "star", keys: ["star", "rating", "featured"] },
  ];

  for (const rule of rules) {
    if (
      !used.has(rule.icon) &&
      rule.keys.some((key) => haystack.includes(key))
    ) {
      return rule.icon;
    }
  }

  const fallback = IMPACT_ICON_VALUES.find((icon) => !used.has(icon));
  return fallback || "trophy";
};

const makeId = (prefix, index) =>
  `${prefix}_${index + 1}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeImpactItem = (item = {}, index = 0, usedIcons = []) => {
  const value = typeof item.value === "string" ? item.value.trim() : "";
  const label = typeof item.label === "string" ? item.label.trim() : "";
  const rawIcon = String(item.icon || "").trim();
  let icon = IMPACT_ICON_VALUES.includes(rawIcon)
    ? rawIcon
    : suggestImpactIcon(label, value, usedIcons);

  if (usedIcons.includes(icon)) {
    icon = suggestImpactIcon(label, value, usedIcons);
  }

  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : makeId("impact", index),
    icon,
    value,
    label,
    order: typeof item.order === "number" ? item.order : index,
  };
};

const normalizeBadge = (badge = {}, index = 0) => ({
  id:
    typeof badge.id === "string" && badge.id.trim()
      ? badge.id.trim()
      : makeId("badge", index),
  label:
    typeof badge.label === "string" && badge.label.trim()
      ? badge.label.trim().toUpperCase()
      : "",
  direction: badge.direction === "rtl" ? "rtl" : "ltr",
  order: typeof badge.order === "number" ? badge.order : index,
});

const normalizeSelector = (
  person = {},
  index = 0,
  existingById = {},
  badgesById = {},
  badgesByLabel = {},
) => {
  const id =
    typeof person.id === "string" && person.id.trim()
      ? person.id.trim()
      : makeId("selector", index);
  const existing = existingById[id] || {};

  let badgeId =
    typeof person.badgeId === "string" ? person.badgeId.trim() : "";
  let badge =
    typeof person.badge === "string" && person.badge.trim()
      ? person.badge.trim().toUpperCase()
      : "";

  if (badgeId && badgesById[badgeId]) {
    badge = badgesById[badgeId].label;
  } else if (badge && badgesByLabel[badge]) {
    badgeId = badgesByLabel[badge].id;
    badge = badgesByLabel[badge].label;
  } else if (badgeId && !badgesById[badgeId]) {
    badgeId = "";
    badge = "";
  }

  return {
    id,
    name: typeof person.name === "string" ? person.name.trim() : "",
    role: typeof person.role === "string" ? person.role.trim() : "",
    badgeId,
    badge,
    imageUrl:
      typeof person.imageUrl === "string"
        ? person.imageUrl.trim()
        : existing.imageUrl || "",
    imageKey:
      typeof person.imageKey === "string"
        ? person.imageKey.trim()
        : existing.imageKey || "",
    order: typeof person.order === "number" ? person.order : index,
  };
};

const deriveBadgesFromPeople = (people = []) => {
  const seen = new Map();
  people.forEach((person) => {
    const label =
      typeof person.badge === "string" && person.badge.trim()
        ? person.badge.trim().toUpperCase()
        : "";
    if (label && !seen.has(label)) {
      seen.set(label, {
        id: makeId("badge", seen.size),
        label,
        direction: "ltr",
        order: seen.size,
      });
    }
  });
  return Array.from(seen.values());
};

const normalizeSelectorsBlock = (
  selectorsRaw = {},
  existingPeople = [],
  existingBadges = [],
) => {
  const existingById = Object.fromEntries(
    (existingPeople || []).map((person) => [person.id, person]),
  );

  const hasBadgesKey = Object.prototype.hasOwnProperty.call(
    selectorsRaw || {},
    "badges",
  );

  let badges;
  if (hasBadgesKey && Array.isArray(selectorsRaw.badges)) {
    badges = selectorsRaw.badges.map((badge, index) =>
      normalizeBadge(badge, index),
    );
    badges = badges.filter((badge) => badge.label);
  } else if (Array.isArray(existingBadges) && existingBadges.length) {
    badges = existingBadges.map((badge, index) => normalizeBadge(badge, index));
    badges = badges.filter((badge) => badge.label);
  } else {
    badges = [];
  }

  badges.sort((a, b) => a.order - b.order);
  badges = badges.map((badge, index) => ({ ...badge, order: index }));

  const rawPeople = Array.isArray(selectorsRaw.people)
    ? selectorsRaw.people
    : [];

  if (!badges.length) {
    badges = deriveBadgesFromPeople(rawPeople);
  }

  const badgesById = Object.fromEntries(badges.map((badge) => [badge.id, badge]));
  const badgesByLabel = Object.fromEntries(
    badges.map((badge) => [badge.label, badge]),
  );

  let people = rawPeople.map((person, index) =>
    normalizeSelector(person, index, existingById, badgesById, badgesByLabel),
  );
  people.sort((a, b) => a.order - b.order);
  people = people.map((person, index) => ({ ...person, order: index }));

  return {
    title:
      typeof selectorsRaw.title === "string" ? selectorsRaw.title.trim() : "",
    description:
      typeof selectorsRaw.description === "string"
        ? selectorsRaw.description.replace(/\r\n/g, "\n").trim()
        : "",
    badges,
    people,
  };
};

const normalizeTestimonial = (item = {}, index = 0) => {
  let rating = Number(item.rating);
  if (!Number.isFinite(rating)) rating = 5;
  rating = Math.min(5, Math.max(1, Math.round(rating)));
  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : makeId("testimonial", index),
    quote:
      typeof item.quote === "string"
        ? item.quote.replace(/\r\n/g, "\n").trim()
        : "",
    name: typeof item.name === "string" ? item.name.trim() : "",
    text:
      typeof item.text === "string"
        ? item.text.replace(/\r\n/g, "\n").trim()
        : "",
    rating,
    order: typeof item.order === "number" ? item.order : index,
  };
};

const normalizeHomeShowcase = (doc = {}) => {
  const raw = doc?.toObject ? doc.toObject() : doc || {};
  const impactRaw = raw.impact || {};
  const selectorsRaw = raw.selectors || {};
  const testimonialsRaw = raw.testimonials || {};

  let impactItems = [];
  if (Array.isArray(impactRaw.items)) {
    const usedIcons = [];
    impactItems = impactRaw.items.map((item, index) => {
      const normalized = normalizeImpactItem(item, index, usedIcons);
      usedIcons.push(normalized.icon);
      return normalized;
    });
  }
  impactItems.sort((a, b) => a.order - b.order);
  impactItems = impactItems.map((item, index) => ({ ...item, order: index }));

  const selectors = normalizeSelectorsBlock(selectorsRaw);

  let testimonials = Array.isArray(testimonialsRaw.items)
    ? testimonialsRaw.items.map((item, index) =>
      normalizeTestimonial(item, index),
    )
    : [];
  testimonials.sort((a, b) => a.order - b.order);
  testimonials = testimonials.map((item, index) => ({ ...item, order: index }));

  return {
    impact: {
      title: typeof impactRaw.title === "string" ? impactRaw.title.trim() : "",
      description:
        typeof impactRaw.description === "string"
          ? impactRaw.description.replace(/\r\n/g, "\n").trim()
          : "",
      items: impactItems,
    },
    selectors,
    testimonials: {
      title:
        typeof testimonialsRaw.title === "string"
          ? testimonialsRaw.title.trim()
          : "",
      description:
        typeof testimonialsRaw.description === "string"
          ? testimonialsRaw.description.replace(/\r\n/g, "\n").trim()
          : "",
      items: testimonials,
    },
  };
};

const SHOWCASE_SECTIONS = ["impact", "selectors", "testimonials"];

const validateSectionCopy = (section, label) => {
  if (String(section.title || "").length > TITLE_MAX_LENGTH) {
    throw new Error(`${label} title must be at most ${TITLE_MAX_LENGTH} characters`);
  }
  if (String(section.description || "").length > DESCRIPTION_MAX_LENGTH) {
    throw new Error(
      `${label} description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
    );
  }
};

const validateImpactSection = (impact) => {
  validateSectionCopy(impact, "Impact");
  if (impact.items.length > MAX_IMPACT_ITEMS) {
    throw new Error(`At most ${MAX_IMPACT_ITEMS} impact stats are allowed`);
  }
  if (impact.items.length > 0 && !impact.title) {
    throw new Error("Impact title is required when stats are added");
  }
  impact.items.forEach((item, index) => {
    if (!item.value) {
      throw new Error(`Impact stat ${index + 1}: value is required`);
    }
    if (!item.label) {
      throw new Error(`Impact stat ${index + 1}: label is required`);
    }
  });
};

const validateSelectorsSection = (selectors) => {
  validateSectionCopy(selectors, "Selectors");
  if (selectors.people.length > 0 && !selectors.title) {
    throw new Error("Selectors title is required when people are added");
  }

  const labelSeen = new Set();
  (selectors.badges || []).forEach((badge, index) => {
    if (!badge.label) {
      throw new Error(`Badge ${index + 1}: label is required`);
    }
    if (labelSeen.has(badge.label)) {
      throw new Error(`Badge "${badge.label}" is duplicated`);
    }
    labelSeen.add(badge.label);
  });

  const badgeIds = new Set((selectors.badges || []).map((badge) => badge.id));
  selectors.people.forEach((person, index) => {
    if (!person.name) {
      throw new Error(`Selector ${index + 1}: name is required`);
    }
    if (!person.role) {
      throw new Error(`Selector ${index + 1}: role is required`);
    }
    if (!person.badgeId) {
      throw new Error(`Selector ${index + 1}: badge is required`);
    }
    if (!badgeIds.has(person.badgeId)) {
      throw new Error(
        `Selector ${index + 1}: choose a badge from the badge list`,
      );
    }
  });
};

const validateTestimonialsSection = (testimonials) => {
  validateSectionCopy(testimonials, "Testimonials");
  if (testimonials.items.length > 0 && !testimonials.title) {
    throw new Error("Testimonials title is required when items are added");
  }
  testimonials.items.forEach((item, index) => {
    if (!item.quote) {
      throw new Error(`Testimonial ${index + 1}: quote is required`);
    }
    if (!item.name) {
      throw new Error(`Testimonial ${index + 1}: name is required`);
    }
    if (!item.text) {
      throw new Error(`Testimonial ${index + 1}: text is required`);
    }
  });
};

const buildSelectorsFromPayload = (payloadSelectors, current) => {
  if (!payloadSelectors) {
    return current.selectors;
  }
  return normalizeSelectorsBlock(
    payloadSelectors,
    current.selectors.people || [],
    current.selectors.badges || [],
  );
};

/**
 * Validate full showcase payload (all sections). Kept for compatibility.
 */
const validateHomeShowcasePayload = (payload = {}, existing = {}) => {
  const current = normalizeHomeShowcase(existing);
  const incoming = normalizeHomeShowcase({
    impact: payload.impact ?? current.impact,
    selectors: buildSelectorsFromPayload(payload.selectors, current),
    testimonials: payload.testimonials ?? current.testimonials,
  });

  validateImpactSection(incoming.impact);
  validateSelectorsSection(incoming.selectors);
  validateTestimonialsSection(incoming.testimonials);

  return incoming;
};

/**
 * Validate and return only one section for partial save.
 * @param {"impact"|"selectors"|"testimonials"} section
 */
const validateHomeShowcaseSection = (
  section,
  payload = {},
  existing = {},
) => {
  if (!SHOWCASE_SECTIONS.includes(section)) {
    throw new Error(
      `Invalid section. Use one of: ${SHOWCASE_SECTIONS.join(", ")}`,
    );
  }

  const current = normalizeHomeShowcase(existing);

  if (section === "impact") {
    if (payload.impact == null) {
      throw new Error("Impact section payload is required");
    }
    const impact = normalizeHomeShowcase({ impact: payload.impact }).impact;
    validateImpactSection(impact);
    return { section, impact };
  }

  if (section === "selectors") {
    if (payload.selectors == null) {
      throw new Error("Selectors section payload is required");
    }
    const selectors = buildSelectorsFromPayload(payload.selectors, current);
    validateSelectorsSection(selectors);
    return { section, selectors };
  }

  if (payload.testimonials == null) {
    throw new Error("Testimonials section payload is required");
  }
  const testimonials = normalizeHomeShowcase({
    testimonials: payload.testimonials,
  }).testimonials;
  validateTestimonialsSection(testimonials);
  return { section, testimonials };
};

const toPublicHomeShowcase = (doc = {}) => {
  const data = normalizeHomeShowcase(doc);
  return {
    impact: {
      ...data.impact,
      items: data.impact.items,
    },
    selectors: {
      title: data.selectors.title,
      description: data.selectors.description,
      badges: (data.selectors.badges || []).map(
        ({ id, label, direction, order }) => ({
          id,
          label,
          direction: direction === "rtl" ? "rtl" : "ltr",
          order,
        }),
      ),
      people: data.selectors.people
        .filter((person) => person.imageUrl)
        .map(({ id, name, role, badgeId, badge, imageUrl, order }) => ({
          id,
          name,
          role,
          badgeId,
          badge,
          imageUrl,
          order,
        })),
    },
    testimonials: {
      title: data.testimonials.title,
      description: data.testimonials.description,
      items: data.testimonials.items,
    },
  };
};

module.exports = {
  IMPACT_ICON_VALUES,
  MAX_IMPACT_ITEMS,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  SHOWCASE_SECTIONS,
  suggestImpactIcon,
  normalizeHomeShowcase,
  validateHomeShowcasePayload,
  validateHomeShowcaseSection,
  toPublicHomeShowcase,
};
