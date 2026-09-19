const mongoose = require("mongoose");
const { Schema } = mongoose;

const COMMON_SETTINGS_SINGLETON_KEY = "GLOBAL";

const CommonSettingsSchema = new Schema(
  {
    // General Information
    name: {
      type: String,
      required: true,
      trim: true,
      default: "PROJECT",
    },
    abbreviation: {
      type: String,
      trim: true,
      default: "",
    },
    developedBy: {
      type: String,
      trim: true,
      default: "",
    },
    developedByLink: {
      type: String,
      trim: true,
      default: "",
    },
    singletonKey: {
      type: String,
      required: true,
      default: COMMON_SETTINGS_SINGLETON_KEY,
      unique: true,
      index: true,
    },

    // Logo
    logoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    logoKey: {
      type: String,
      trim: true,
      default: "",
    },

    // Social Media Links (admin-managed list)
    socialMedia: {
      links: [
        {
          id: { type: String, trim: true, default: "" },
          platform: { type: String, trim: true, default: "facebook" },
          url: { type: String, trim: true, default: "" },
          order: { type: Number, default: 0 },
        },
      ],
    },

    // Authentication Settings
    loginEnabled: {
      type: Boolean,
      default: true,
    },
    registerEnabled: {
      type: Boolean,
      default: true,
    },

    // Homepage gallery section (shared across all gallery images)
    gallery: {
      title: {
        type: String,
        trim: true,
        default: "",
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Homepage videos section (shared across all videos)
    video: {
      title: {
        type: String,
        trim: true,
        default: "",
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Homepage news section (shared across all news items)
    news: {
      title: {
        type: String,
        trim: true,
        default: "",
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Homepage official teams section
    teams: {
      title: {
        type: String,
        trim: true,
        default: "",
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Homepage FAQ section
    faq: {
      title: {
        type: String,
        trim: true,
        default: "",
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Homepage "How Our Platform Works" section (0–10 steps; hide when empty)
    howItWorks: {
      title: {
        type: String,
        trim: true,
        default: "",
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
      steps: [
        {
          id: { type: String, trim: true, default: "" },
          heading: { type: String, trim: true, default: "" },
          description: { type: String, trim: true, default: "" },
          order: { type: Number, default: 0 },
        },
      ],
    },

    // Homepage hero overlay (shared across all slider banners)
    hero: {
      title: {
        type: String,
        trim: true,
        default: "",
      },
      tagline: {
        type: String,
        trim: true,
        default: "",
      },
      buttons: {
        type: [
          {
            id: { type: String, trim: true, default: "" },
            label: { type: String, trim: true, default: "" },
            path: { type: String, trim: true, default: "" },
            variant: {
              type: String,
              enum: ["primary", "outline", "ghost"],
              default: "ghost",
            },
            order: { type: Number, default: 0 },
          },
        ],
        default: () => [],
      },
    },

    // About Us Page Content
    aboutUs: {
      title: {
        type: String,
        trim: true,
        default: "",
      },
      intro: {
        type: String,
        trim: true,
        default: "",
      },
      sections: [
        {
          id: { type: String, trim: true, default: "" },
          heading: { type: String, trim: true, default: "" },
          description: { type: String, trim: true, default: "" },
          imageUrl: { type: String, trim: true, default: "" },
          imageKey: { type: String, trim: true, default: "" },
          order: { type: Number, default: 0 },
        },
      ],
    },

    // Contact Us Page Content
    contactUsPage: {
      title: {
        type: String,
        trim: true,
        default: "",
      },
      intro: {
        type: String,
        trim: true,
        default: "",
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
      secondaryPhone: {
        type: String,
        trim: true,
        default: "",
      },
      email: {
        type: String,
        trim: true,
        default: "",
      },
      address: {
        type: String,
        trim: true,
        default: "",
      },
      businessHours: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Coming Soon Page Settings
    comingSoon: {
      enabled: {
        type: Boolean,
        default: false,
      },
      title: {
        type: String,
        trim: true,
        default: "",
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
      initiatives: [
        {
          title: {
            type: String,
            trim: true,
            required: true,
          },
          description: {
            type: String,
            trim: true,
            default: "",
          },
          order: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  },
);

CommonSettingsSchema.index(
  { singletonKey: 1 },
  { unique: true, name: "common_settings_singleton_key_unique" },
);

// Ensure singletonKey before Mongoose validation (legacy docs may lack it).
CommonSettingsSchema.pre("validate", function () {
  if (!this.singletonKey) {
    this.singletonKey = COMMON_SETTINGS_SINGLETON_KEY;
  }
});

// Singleton guard: only one common settings document is allowed.
CommonSettingsSchema.pre("save", async function () {
  if (!this.isNew) {
    return;
  }

  const existingSettings = await this.constructor.exists({
    _id: { $ne: this._id },
  });
  if (existingSettings) {
    throw new Error("Not allowed: common settings already exist");
  }
});

// Static method to get or create settings (ensures only one document exists)
CommonSettingsSchema.statics.getOrCreateSettings = async function () {
  try {
    // Keep the oldest document and remove accidental duplicates.
    let settings = await this.findOne().sort({ createdAt: 1, _id: 1 });

    if (settings) {
      if (settings.singletonKey !== COMMON_SETTINGS_SINGLETON_KEY) {
        await this.updateOne(
          { _id: settings._id },
          { $set: { singletonKey: COMMON_SETTINGS_SINGLETON_KEY } },
        );
        // Re-fetch so in-memory doc matches DB (legacy docs may lack singletonKey).
        settings = await this.findById(settings._id);
      }

      await this.deleteMany({ _id: { $ne: settings._id } });
      return settings;
    }

    settings = await this.findOneAndUpdate(
      { singletonKey: COMMON_SETTINGS_SINGLETON_KEY },
      {
        $setOnInsert: {
          singletonKey: COMMON_SETTINGS_SINGLETON_KEY,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );
    console.log("✅ Common Settings Created");

    return settings;
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await this.findOne({
        singletonKey: COMMON_SETTINGS_SINGLETON_KEY,
      });
      if (existing) {
        return existing;
      }
    }
    console.error("Error in getOrCreateSettings:", error);
    throw error;
  }
};

const CommonSettings = mongoose.model("common_settings", CommonSettingsSchema);

module.exports = CommonSettings;
module.exports.COMMON_SETTINGS_SINGLETON_KEY = COMMON_SETTINGS_SINGLETON_KEY;
