/**
 * Routes Loader Module
 *
 * Loads and registers all application routes.
 */

const loadRoutes = (app) => {
  const adminModule = require("../../modules/admin");
  const userModule = require("../../modules/user");
  const commonModule = require("../../modules/common");

  app.use("/api", adminModule.routes);
  app.use("/api", userModule.routes);
  app.use("/api/common", commonModule.routes);

  console.log("✅ Routes loaded");
};

module.exports = {
  loadRoutes,
};
