const response = require("../../../config/response");
const HomeShowcase = require("../../../models/HomeShowcase");
const { uploadToR2, deleteFromR2 } = require("../../../infra/storage/r2Helper");
const {
  normalizeHomeShowcase,
  validateHomeShowcaseSection,
  SHOWCASE_SECTIONS,
  MAX_IMPACT_ITEMS,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  IMPACT_ICON_VALUES,
  toPublicHomeShowcase,
} = require("../../../shared/utils/homeShowcaseHelpers");

const SELECTOR_FILE_FIELD = /^selector_(.+)$/;

const SECTION_SETTINGS_LABELS = {
  impact: "Impact",
  selectors: "Mentors & Selectors",
  testimonials: "Testimonials",
};

const makeBadgeId = () =>
  `badge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const makePersonId = () =>
  `selector_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const makeImpactId = () =>
  `impact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const makeTestimonialId = () =>
  `testimonial_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeBadgeLabel = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

const normalizeBadgeDirection = (value) =>
  value === "rtl" ? "rtl" : "ltr";

const validateSectionSettingsFields = (title, description) => {
  if (!title) {
    throw new Error("Title is required");
  }
  if (title.length > TITLE_MAX_LENGTH) {
    throw new Error(`Title must be at most ${TITLE_MAX_LENGTH} characters`);
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    throw new Error(
      `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
    );
  }
};

const resolvePersonBadge = (badgeId, badges = []) => {
  const id = typeof badgeId === "string" ? badgeId.trim() : "";
  if (!id) {
    throw new Error("Badge is required");
  }
  const badge = badges.find((entry) => entry.id === id);
  if (!badge) {
    throw new Error("Choose a badge from the badge list");
  }
  return { badgeId: badge.id, badge: badge.label };
};

const parseShowcasePayload = (body = {}) => {
  let payload = body?.showcase ?? body;

  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }

  if (payload?.showcase && typeof payload.showcase === "object") {
    payload = payload.showcase;
  }

  return payload || {};
};

const parseSection = (body = {}, payload = {}) => {
  const raw =
    body?.section ||
    payload?.section ||
    (typeof body?.showcase === "object" ? body.showcase?.section : null);

  return typeof raw === "string" ? raw.trim() : "";
};

const applySelectorImages = async ({
  people,
  existingPeople,
  files,
  uploadedKeys,
}) => {
  const fileBySelectorId = {};
  (Array.isArray(files) ? files : []).forEach((file) => {
    const match = String(file.fieldname || "").match(SELECTOR_FILE_FIELD);
    if (match?.[1]) {
      fileBySelectorId[match[1]] = file;
    }
  });

  const existingById = Object.fromEntries(
    (existingPeople || []).map((person) => [person.id, person]),
  );

  const nextPeople = [];
  for (const person of people) {
    const previous = existingById[person.id] || {};
    let imageUrl = previous.imageUrl || person.imageUrl || "";
    let imageKey = previous.imageKey || person.imageKey || "";
    const uploadFile = fileBySelectorId[person.id];

    if (uploadFile) {
      const uploadResult = await uploadToR2(uploadFile, "home-showcase");
      uploadedKeys.push(uploadResult.key);
      if (imageKey) {
        try {
          await deleteFromR2(imageKey);
        } catch (deleteError) {
          console.error("Error deleting old selector image:", deleteError);
        }
      }
      imageUrl = uploadResult.url;
      imageKey = uploadResult.key;
    }

    if (!imageUrl || !imageKey) {
      throw new Error(
        `Selector "${person.name || person.id}": photo is required`,
      );
    }

    nextPeople.push({
      ...person,
      imageUrl,
      imageKey,
    });
  }

  for (const oldPerson of existingPeople || []) {
    const stillUsed = nextPeople.some(
      (person) =>
        person.id === oldPerson.id && person.imageKey === oldPerson.imageKey,
    );
    if (!stillUsed && oldPerson.imageKey) {
      try {
        await deleteFromR2(oldPerson.imageKey);
      } catch (deleteError) {
        console.error("Error deleting removed selector image:", deleteError);
      }
    }
  }

  return nextPeople;
};

/**
 * @route GET /api/admin/home-showcase
 */
const getHomeShowcase = async (req, res) => {
  try {
    const doc = await HomeShowcase.getOrCreate();
    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Home showcase fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching home showcase:", error);
    return response.errorResponse(
      res,
      {},
      "Failed to fetch home showcase",
      500,
    );
  }
};

/**
 * @route PUT /api/admin/home-showcase
 * Body: section = impact|selectors|testimonials + that section payload only
 */
const updateHomeShowcase = async (req, res) => {
  const uploadedKeys = [];

  try {
    const payload = parseShowcasePayload(req.body);
    const section = parseSection(req.body, payload);

    if (!SHOWCASE_SECTIONS.includes(section)) {
      return response.errorResponse(
        res,
        [{ path: "section", msg: `section must be one of: ${SHOWCASE_SECTIONS.join(", ")}` }],
        `section must be one of: ${SHOWCASE_SECTIONS.join(", ")}`,
        400,
      );
    }

    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);
    const validated = validateHomeShowcaseSection(section, payload, existing);

    if (section === "impact") {
      doc.impact = validated.impact;
      doc.markModified("impact");
    } else if (section === "selectors") {
      const nextPeople = await applySelectorImages({
        people: validated.selectors.people,
        existingPeople: existing.selectors.people,
        files: req.files,
        uploadedKeys,
      });
      doc.selectors = {
        ...validated.selectors,
        people: nextPeople,
      };
      doc.markModified("selectors");
    } else {
      doc.testimonials = validated.testimonials;
      doc.markModified("testimonials");
    }

    await doc.save();

    const labels = {
      impact: "Impact",
      selectors: "Mentors & Selectors",
      testimonials: "Testimonials",
    };

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      `${labels[section]} updated successfully`,
    );
  } catch (error) {
    console.error("Error updating home showcase:", error);

    for (const key of uploadedKeys) {
      try {
        await deleteFromR2(key);
      } catch (cleanupError) {
        console.error("Error cleaning up uploaded selector image:", cleanupError);
      }
    }

    return response.errorResponse(
      res,
      [{ path: "showcase", msg: error.message }],
      error.message || "Failed to update home showcase",
      400,
    );
  }
};

/**
 * @route GET /api/common/home-showcase
 */
const getPublicHomeShowcase = async (req, res) => {
  try {
    const doc = await HomeShowcase.getOrCreate();
    return response.successResponse(
      res,
      toPublicHomeShowcase(doc),
      "Home showcase fetched successfully",
    );
  } catch (error) {
    console.error("Error fetching public home showcase:", error);
    return response.errorResponse(
      res,
      {},
      "Failed to fetch home showcase",
      500,
    );
  }
};

/**
 * @route POST /api/admin/home-showcase/badges
 */
const createSelectorBadge = async (req, res) => {
  try {
    const label = normalizeBadgeLabel(req.body?.label);
    const direction = normalizeBadgeDirection(req.body?.direction);
    if (!label) {
      return response.errorResponse(
        res,
        [{ path: "label", msg: "Badge label is required" }],
        "Badge label is required",
        400,
      );
    }

    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);
    const badges = [...(existing.selectors.badges || [])];

    if (badges.some((badge) => badge.label === label)) {
      return response.errorResponse(
        res,
        [{ path: "label", msg: "A badge with this label already exists" }],
        "A badge with this label already exists",
        400,
      );
    }

    badges.push({
      id: makeBadgeId(),
      label,
      direction,
      order: badges.length,
    });

    doc.selectors = {
      ...existing.selectors,
      badges,
      people: existing.selectors.people,
    };
    doc.markModified("selectors");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Badge created successfully",
    );
  } catch (error) {
    console.error("Error creating selector badge:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to create badge",
      500,
    );
  }
};

/**
 * @route PUT /api/admin/home-showcase/badges/:id
 */
const updateSelectorBadge = async (req, res) => {
  try {
    const badgeId = String(req.params.id || "").trim();
    const label = normalizeBadgeLabel(req.body?.label);
    const direction = normalizeBadgeDirection(req.body?.direction);

    if (!badgeId) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Badge id is required" }],
        "Badge id is required",
        400,
      );
    }
    if (!label) {
      return response.errorResponse(
        res,
        [{ path: "label", msg: "Badge label is required" }],
        "Badge label is required",
        400,
      );
    }

    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);
    const badges = [...(existing.selectors.badges || [])];
    const index = badges.findIndex((badge) => badge.id === badgeId);

    if (index < 0) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Badge not found" }],
        "Badge not found",
        404,
      );
    }

    if (badges.some((badge, i) => i !== index && badge.label === label)) {
      return response.errorResponse(
        res,
        [{ path: "label", msg: "A badge with this label already exists" }],
        "A badge with this label already exists",
        400,
      );
    }

    badges[index] = { ...badges[index], label, direction };
    const people = (existing.selectors.people || []).map((person) =>
      person.badgeId === badgeId ? { ...person, badge: label } : person,
    );

    doc.selectors = {
      ...existing.selectors,
      badges,
      people,
    };
    doc.markModified("selectors");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Badge updated successfully",
    );
  } catch (error) {
    console.error("Error updating selector badge:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to update badge",
      500,
    );
  }
};

/**
 * @route DELETE /api/admin/home-showcase/badges/:id
 */
const deleteSelectorBadge = async (req, res) => {
  try {
    const badgeId = String(req.params.id || "").trim();
    if (!badgeId) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Badge id is required" }],
        "Badge id is required",
        400,
      );
    }

    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);
    const badges = (existing.selectors.badges || []).filter(
      (badge) => badge.id !== badgeId,
    );

    if (badges.length === (existing.selectors.badges || []).length) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Badge not found" }],
        "Badge not found",
        404,
      );
    }

    const people = (existing.selectors.people || []).map((person) =>
      person.badgeId === badgeId
        ? { ...person, badgeId: "", badge: "" }
        : person,
    );

    doc.selectors = {
      ...existing.selectors,
      badges: badges.map((badge, order) => ({ ...badge, order })),
      people,
    };
    doc.markModified("selectors");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Badge deleted successfully",
    );
  } catch (error) {
    console.error("Error deleting selector badge:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to delete badge",
      500,
    );
  }
};

/**
 * @route PUT /api/admin/home-showcase/:section/settings
 * section = impact | selectors | testimonials
 */
const updateSectionSettings = async (req, res) => {
  try {
    const section = String(req.params.section || "").trim();
    if (!SHOWCASE_SECTIONS.includes(section)) {
      return response.errorResponse(
        res,
        [{ path: "section", msg: `Invalid section` }],
        `section must be one of: ${SHOWCASE_SECTIONS.join(", ")}`,
        400,
      );
    }

    const title =
      typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body?.description === "string"
        ? req.body.description.replace(/\r\n/g, "\n").trim()
        : "";

    validateSectionSettingsFields(title, description);

    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);

    doc[section] = {
      ...existing[section],
      title,
      description,
    };
    doc.markModified(section);
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      `${SECTION_SETTINGS_LABELS[section]} settings updated successfully`,
    );
  } catch (error) {
    console.error("Error updating section settings:", error);
    return response.errorResponse(
      res,
      [{ path: "title", msg: error.message }],
      error.message || "Failed to update settings",
      400,
    );
  }
};

/** @deprecated alias — use updateSectionSettings */
const updateSelectorsSettings = (req, res) => {
  req.params.section = "selectors";
  return updateSectionSettings(req, res);
};

/**
 * @route POST /api/admin/home-showcase/people
 */
const createSelectorPerson = async (req, res) => {
  const uploadedKeys = [];
  try {
    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);

    if (!existing.selectors.title) {
      return response.errorResponse(
        res,
        [{ path: "title", msg: "Set section title first before adding people" }],
        "Set section title first before adding people",
        400,
      );
    }

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const role = typeof req.body?.role === "string" ? req.body.role.trim() : "";
    if (!name) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "Name is required" }],
        "Name is required",
        400,
      );
    }
    if (!role) {
      return response.errorResponse(
        res,
        [{ path: "role", msg: "Role is required" }],
        "Role is required",
        400,
      );
    }

    const { badgeId, badge } = resolvePersonBadge(
      req.body?.badgeId,
      existing.selectors.badges,
    );

    const uploadFile = Array.isArray(req.files)
      ? req.files.find((file) => file.fieldname === "image")
      : req.file;
    if (!uploadFile) {
      return response.errorResponse(
        res,
        [{ path: "image", msg: "Photo is required" }],
        "Photo is required",
        400,
      );
    }

    const uploadResult = await uploadToR2(uploadFile, "home-showcase");
    uploadedKeys.push(uploadResult.key);

    const person = {
      id: makePersonId(),
      name,
      role,
      badgeId,
      badge,
      imageUrl: uploadResult.url,
      imageKey: uploadResult.key,
      order: (existing.selectors.people || []).length,
    };

    doc.selectors = {
      ...existing.selectors,
      people: [...(existing.selectors.people || []), person],
    };
    doc.markModified("selectors");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Person added successfully",
    );
  } catch (error) {
    console.error("Error creating selector person:", error);
    for (const key of uploadedKeys) {
      try {
        await deleteFromR2(key);
      } catch (cleanupError) {
        console.error("Error cleaning up person image:", cleanupError);
      }
    }
    return response.errorResponse(
      res,
      [{ path: "showcase", msg: error.message }],
      error.message || "Failed to add person",
      400,
    );
  }
};

/**
 * @route PUT /api/admin/home-showcase/people/:id
 */
const updateSelectorPerson = async (req, res) => {
  const uploadedKeys = [];
  try {
    const personId = String(req.params.id || "").trim();
    if (!personId) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Person id is required" }],
        "Person id is required",
        400,
      );
    }

    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);
    const people = [...(existing.selectors.people || [])];
    const index = people.findIndex((person) => person.id === personId);
    if (index < 0) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Person not found" }],
        "Person not found",
        404,
      );
    }

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const role = typeof req.body?.role === "string" ? req.body.role.trim() : "";
    if (!name) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "Name is required" }],
        "Name is required",
        400,
      );
    }
    if (!role) {
      return response.errorResponse(
        res,
        [{ path: "role", msg: "Role is required" }],
        "Role is required",
        400,
      );
    }

    const { badgeId, badge } = resolvePersonBadge(
      req.body?.badgeId,
      existing.selectors.badges,
    );

    const current = people[index];
    let imageUrl = current.imageUrl || "";
    let imageKey = current.imageKey || "";
    const uploadFile = Array.isArray(req.files)
      ? req.files.find((file) => file.fieldname === "image")
      : req.file;

    if (uploadFile) {
      const uploadResult = await uploadToR2(uploadFile, "home-showcase");
      uploadedKeys.push(uploadResult.key);
      if (imageKey) {
        try {
          await deleteFromR2(imageKey);
        } catch (deleteError) {
          console.error("Error deleting old person image:", deleteError);
        }
      }
      imageUrl = uploadResult.url;
      imageKey = uploadResult.key;
    }

    if (!imageUrl || !imageKey) {
      return response.errorResponse(
        res,
        [{ path: "image", msg: "Photo is required" }],
        "Photo is required",
        400,
      );
    }

    people[index] = {
      ...current,
      name,
      role,
      badgeId,
      badge,
      imageUrl,
      imageKey,
    };

    doc.selectors = {
      ...existing.selectors,
      people,
    };
    doc.markModified("selectors");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Person updated successfully",
    );
  } catch (error) {
    console.error("Error updating selector person:", error);
    for (const key of uploadedKeys) {
      try {
        await deleteFromR2(key);
      } catch (cleanupError) {
        console.error("Error cleaning up person image:", cleanupError);
      }
    }
    return response.errorResponse(
      res,
      [{ path: "showcase", msg: error.message }],
      error.message || "Failed to update person",
      400,
    );
  }
};

/**
 * @route DELETE /api/admin/home-showcase/people/:id
 */
const deleteSelectorPerson = async (req, res) => {
  try {
    const personId = String(req.params.id || "").trim();
    if (!personId) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Person id is required" }],
        "Person id is required",
        400,
      );
    }

    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);
    const target = (existing.selectors.people || []).find(
      (person) => person.id === personId,
    );
    if (!target) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Person not found" }],
        "Person not found",
        404,
      );
    }

    const people = (existing.selectors.people || [])
      .filter((person) => person.id !== personId)
      .map((person, order) => ({ ...person, order }));

    if (target.imageKey) {
      try {
        await deleteFromR2(target.imageKey);
      } catch (deleteError) {
        console.error("Error deleting person image:", deleteError);
      }
    }

    doc.selectors = {
      ...existing.selectors,
      people,
    };
    doc.markModified("selectors");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Person deleted successfully",
    );
  } catch (error) {
    console.error("Error deleting selector person:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to delete person",
      500,
    );
  }
};

/**
 * @route POST /api/admin/home-showcase/impact/items
 */
const createImpactItem = async (req, res) => {
  try {
    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);

    if (!existing.impact.title) {
      return response.errorResponse(
        res,
        [{ path: "title", msg: "Set section title first before adding stats" }],
        "Set section title first before adding stats",
        400,
      );
    }

    const items = [...(existing.impact.items || [])];
    if (items.length >= MAX_IMPACT_ITEMS) {
      return response.errorResponse(
        res,
        [{ path: "value", msg: `At most ${MAX_IMPACT_ITEMS} impact stats are allowed` }],
        `At most ${MAX_IMPACT_ITEMS} impact stats are allowed`,
        400,
      );
    }

    const value = typeof req.body?.value === "string" ? req.body.value.trim() : "";
    const label = typeof req.body?.label === "string" ? req.body.label.trim() : "";
    let icon = typeof req.body?.icon === "string" ? req.body.icon.trim() : "";

    if (!value) {
      return response.errorResponse(
        res,
        [{ path: "value", msg: "Value is required" }],
        "Value is required",
        400,
      );
    }
    if (!label) {
      return response.errorResponse(
        res,
        [{ path: "label", msg: "Label is required" }],
        "Label is required",
        400,
      );
    }
    if (!IMPACT_ICON_VALUES.includes(icon)) {
      icon = "trophy";
    }
    if (items.some((item) => item.icon === icon)) {
      return response.errorResponse(
        res,
        [{ path: "icon", msg: "This icon is already used by another stat" }],
        "This icon is already used by another stat",
        400,
      );
    }

    items.push({
      id: makeImpactId(),
      icon,
      value,
      label,
      order: items.length,
    });

    doc.impact = { ...existing.impact, items };
    doc.markModified("impact");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Impact stat added successfully",
    );
  } catch (error) {
    console.error("Error creating impact item:", error);
    return response.errorResponse(
      res,
      [{ path: "showcase", msg: error.message }],
      error.message || "Failed to add impact stat",
      400,
    );
  }
};

/**
 * @route PUT /api/admin/home-showcase/impact/items/:id
 */
const updateImpactItem = async (req, res) => {
  try {
    const itemId = String(req.params.id || "").trim();
    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);
    const items = [...(existing.impact.items || [])];
    const index = items.findIndex((item) => item.id === itemId);

    if (index < 0) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Impact stat not found" }],
        "Impact stat not found",
        404,
      );
    }

    const value = typeof req.body?.value === "string" ? req.body.value.trim() : "";
    const label = typeof req.body?.label === "string" ? req.body.label.trim() : "";
    let icon = typeof req.body?.icon === "string" ? req.body.icon.trim() : "";

    if (!value) {
      return response.errorResponse(
        res,
        [{ path: "value", msg: "Value is required" }],
        "Value is required",
        400,
      );
    }
    if (!label) {
      return response.errorResponse(
        res,
        [{ path: "label", msg: "Label is required" }],
        "Label is required",
        400,
      );
    }
    if (!IMPACT_ICON_VALUES.includes(icon)) {
      icon = items[index].icon || "trophy";
    }
    if (items.some((item, i) => i !== index && item.icon === icon)) {
      return response.errorResponse(
        res,
        [{ path: "icon", msg: "This icon is already used by another stat" }],
        "This icon is already used by another stat",
        400,
      );
    }

    items[index] = { ...items[index], icon, value, label };
    doc.impact = { ...existing.impact, items };
    doc.markModified("impact");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Impact stat updated successfully",
    );
  } catch (error) {
    console.error("Error updating impact item:", error);
    return response.errorResponse(
      res,
      [{ path: "showcase", msg: error.message }],
      error.message || "Failed to update impact stat",
      400,
    );
  }
};

/**
 * @route DELETE /api/admin/home-showcase/impact/items/:id
 */
const deleteImpactItem = async (req, res) => {
  try {
    const itemId = String(req.params.id || "").trim();
    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);
    const before = existing.impact.items || [];
    const items = before
      .filter((item) => item.id !== itemId)
      .map((item, order) => ({ ...item, order }));

    if (items.length === before.length) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Impact stat not found" }],
        "Impact stat not found",
        404,
      );
    }

    doc.impact = { ...existing.impact, items };
    doc.markModified("impact");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Impact stat deleted successfully",
    );
  } catch (error) {
    console.error("Error deleting impact item:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to delete impact stat",
      500,
    );
  }
};

/**
 * @route POST /api/admin/home-showcase/testimonials/items
 */
const createTestimonialItem = async (req, res) => {
  try {
    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);

    if (!existing.testimonials.title) {
      return response.errorResponse(
        res,
        [{ path: "title", msg: "Set section title first before adding stories" }],
        "Set section title first before adding stories",
        400,
      );
    }

    const items = [...(existing.testimonials.items || [])];

    const quote =
      typeof req.body?.quote === "string"
        ? req.body.quote.replace(/\r\n/g, "\n").trim()
        : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const text =
      typeof req.body?.text === "string"
        ? req.body.text.replace(/\r\n/g, "\n").trim()
        : "";
    let rating = Number(req.body?.rating);
    if (!Number.isFinite(rating)) rating = 5;
    rating = Math.min(5, Math.max(1, Math.round(rating)));

    if (!quote) {
      return response.errorResponse(
        res,
        [{ path: "quote", msg: "Quote is required" }],
        "Quote is required",
        400,
      );
    }
    if (!name) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "Name is required" }],
        "Name is required",
        400,
      );
    }
    if (!text) {
      return response.errorResponse(
        res,
        [{ path: "text", msg: "Text is required" }],
        "Text is required",
        400,
      );
    }

    items.push({
      id: makeTestimonialId(),
      quote,
      name,
      text,
      rating,
      order: items.length,
    });

    doc.testimonials = { ...existing.testimonials, items };
    doc.markModified("testimonials");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Testimonial added successfully",
    );
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return response.errorResponse(
      res,
      [{ path: "showcase", msg: error.message }],
      error.message || "Failed to add testimonial",
      400,
    );
  }
};

/**
 * @route PUT /api/admin/home-showcase/testimonials/items/:id
 */
const updateTestimonialItem = async (req, res) => {
  try {
    const itemId = String(req.params.id || "").trim();
    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);
    const items = [...(existing.testimonials.items || [])];
    const index = items.findIndex((item) => item.id === itemId);

    if (index < 0) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Testimonial not found" }],
        "Testimonial not found",
        404,
      );
    }

    const quote =
      typeof req.body?.quote === "string"
        ? req.body.quote.replace(/\r\n/g, "\n").trim()
        : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const text =
      typeof req.body?.text === "string"
        ? req.body.text.replace(/\r\n/g, "\n").trim()
        : "";
    let rating = Number(req.body?.rating);
    if (!Number.isFinite(rating)) rating = items[index].rating || 5;
    rating = Math.min(5, Math.max(1, Math.round(rating)));

    if (!quote) {
      return response.errorResponse(
        res,
        [{ path: "quote", msg: "Quote is required" }],
        "Quote is required",
        400,
      );
    }
    if (!name) {
      return response.errorResponse(
        res,
        [{ path: "name", msg: "Name is required" }],
        "Name is required",
        400,
      );
    }
    if (!text) {
      return response.errorResponse(
        res,
        [{ path: "text", msg: "Text is required" }],
        "Text is required",
        400,
      );
    }

    items[index] = { ...items[index], quote, name, text, rating };
    doc.testimonials = { ...existing.testimonials, items };
    doc.markModified("testimonials");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Testimonial updated successfully",
    );
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return response.errorResponse(
      res,
      [{ path: "showcase", msg: error.message }],
      error.message || "Failed to update testimonial",
      400,
    );
  }
};

/**
 * @route DELETE /api/admin/home-showcase/testimonials/items/:id
 */
const deleteTestimonialItem = async (req, res) => {
  try {
    const itemId = String(req.params.id || "").trim();
    const doc = await HomeShowcase.getOrCreate();
    const existing = normalizeHomeShowcase(doc);
    const before = existing.testimonials.items || [];
    const items = before
      .filter((item) => item.id !== itemId)
      .map((item, order) => ({ ...item, order }));

    if (items.length === before.length) {
      return response.errorResponse(
        res,
        [{ path: "id", msg: "Testimonial not found" }],
        "Testimonial not found",
        404,
      );
    }

    doc.testimonials = { ...existing.testimonials, items };
    doc.markModified("testimonials");
    await doc.save();

    return response.successResponse(
      res,
      normalizeHomeShowcase(doc),
      "Testimonial deleted successfully",
    );
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return response.errorResponse(
      res,
      {},
      error.message || "Failed to delete testimonial",
      500,
    );
  }
};

module.exports = {
  getHomeShowcase,
  updateHomeShowcase,
  getPublicHomeShowcase,
  createSelectorBadge,
  updateSelectorBadge,
  deleteSelectorBadge,
  updateSectionSettings,
  updateSelectorsSettings,
  createSelectorPerson,
  updateSelectorPerson,
  deleteSelectorPerson,
  createImpactItem,
  updateImpactItem,
  deleteImpactItem,
  createTestimonialItem,
  updateTestimonialItem,
  deleteTestimonialItem,
};
