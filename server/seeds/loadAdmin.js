const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const {
  MONGO_URI,
  NODE_ENV,
  SEED_ADMIN_PASSWORD,
  SEED_ADMIN_NAME,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PHONE,
  SEED_ADMIN_ID,
} = require("../config/config");

const Admin = require("../models/Admin");

const WEAK_PASSWORDS = new Set([
  "123456aa",
  "12345678",
  "password",
  "admin123",
  "admin1234",
]);

const loadAdmin = async () => {
  try {
    if (NODE_ENV === "production") {
      console.error(
        "Refusing to run loadAdmin seed while NODE_ENV=production.",
      );
      process.exit(1);
    }

    const password = SEED_ADMIN_PASSWORD;
    if (!password || password.length < 8) {
      console.error(
        "Set SEED_ADMIN_PASSWORD (min 8 chars) before running the admin seed.",
      );
      process.exit(1);
    }
    if (WEAK_PASSWORDS.has(password.toLowerCase())) {
      console.error(
        "SEED_ADMIN_PASSWORD is too weak. Choose a stronger password.",
      );
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);

    const adminData = {
      name: SEED_ADMIN_NAME,
      email: SEED_ADMIN_EMAIL,
      phone: SEED_ADMIN_PHONE,
      admin_id: SEED_ADMIN_ID,
      uuid: randomUUID(),
      status: 1,
    };

    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(password, salt);
    adminData.txn_password = await bcrypt.hash(password, salt);

    const admin = new Admin(adminData);
    await admin.save();

    console.log(`Admin seeded: ${adminData.admin_id}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Admin seed failed:", err);
    try {
      await mongoose.disconnect();
    } catch (_) {
      /* ignore */
    }
    process.exit(1);
  }
};

loadAdmin();
