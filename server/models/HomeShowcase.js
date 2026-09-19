const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} = require("../shared/utils/homeShowcaseHelpers");

const HOME_SHOWCASE_SINGLETON_KEY = "GLOBAL";

const ImpactItemSchema = new Schema(
  {
    id: { type: String, trim: true, default: "" },
    icon: { type: String, trim: true, default: "trophy" },
    value: { type: String, trim: true, default: "" },
    label: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const SelectorBadgeSchema = new Schema(
  {
    id: { type: String, trim: true, default: "" },
    label: { type: String, trim: true, default: "" },
    direction: {
      type: String,
      enum: ["ltr", "rtl"],
      default: "ltr",
    },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const SelectorPersonSchema = new Schema(
  {
    id: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    role: { type: String, trim: true, default: "" },
    badgeId: { type: String, trim: true, default: "" },
    badge: { type: String, trim: true, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
    imageKey: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const TestimonialItemSchema = new Schema(
  {
    id: { type: String, trim: true, default: "" },
    quote: { type: String, trim: true, default: "", maxlength: 500 },
    name: { type: String, trim: true, default: "" },
    text: { type: String, trim: true, default: "" },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const sectionTitleField = {
  type: String,
  trim: true,
  default: "",
  maxlength: TITLE_MAX_LENGTH,
};

const sectionDescriptionField = {
  type: String,
  trim: true,
  default: "",
  maxlength: DESCRIPTION_MAX_LENGTH,
};

const HomeShowcaseSchema = new Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      default: HOME_SHOWCASE_SINGLETON_KEY,
      unique: true,
      index: true,
    },
    impact: {
      title: sectionTitleField,
      description: sectionDescriptionField,
      items: { type: [ImpactItemSchema], default: [] },
    },
    selectors: {
      title: sectionTitleField,
      description: sectionDescriptionField,
      badges: { type: [SelectorBadgeSchema], default: [] },
      people: { type: [SelectorPersonSchema], default: [] },
    },
    testimonials: {
      title: sectionTitleField,
      description: sectionDescriptionField,
      items: { type: [TestimonialItemSchema], default: [] },
    },
  },
  { timestamps: true },
);

HomeShowcaseSchema.pre("validate", function () {
  if (!this.singletonKey) {
    this.singletonKey = HOME_SHOWCASE_SINGLETON_KEY;
  }
});

HomeShowcaseSchema.pre("save", async function () {
  if (!this.isNew) return;
  const existing = await this.constructor.exists({ _id: { $ne: this._id } });
  if (existing) {
    throw new Error("Not allowed: home showcase already exists");
  }
});

HomeShowcaseSchema.statics.getOrCreate = async function () {
  let doc = await this.findOne().sort({ createdAt: 1, _id: 1 });
  if (doc) {
    if (doc.singletonKey !== HOME_SHOWCASE_SINGLETON_KEY) {
      await this.updateOne(
        { _id: doc._id },
        { $set: { singletonKey: HOME_SHOWCASE_SINGLETON_KEY } },
      );
      doc = await this.findById(doc._id);
    }
    await this.deleteMany({ _id: { $ne: doc._id } });
    return doc;
  }

  try {
    doc = await this.findOneAndUpdate(
      { singletonKey: HOME_SHOWCASE_SINGLETON_KEY },
      { $setOnInsert: { singletonKey: HOME_SHOWCASE_SINGLETON_KEY } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    return doc;
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await this.findOne({
        singletonKey: HOME_SHOWCASE_SINGLETON_KEY,
      });
      if (existing) return existing;
    }
    throw error;
  }
};

const HomeShowcase = mongoose.model("home_showcases", HomeShowcaseSchema);

module.exports = HomeShowcase;
module.exports.HOME_SHOWCASE_SINGLETON_KEY = HOME_SHOWCASE_SINGLETON_KEY;
