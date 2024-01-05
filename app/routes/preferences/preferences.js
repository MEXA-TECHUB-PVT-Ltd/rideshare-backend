const express = require("express");
const router = express.Router();

// project file directories
const controller = require("../../controllers/preferences/preferences");
const {
  queryValidation,
  validateUpdatePreferences,
  validatePreferences,
} = require("../../middlewares/bodyValidations");
const { cloudinaryUpload } = require("../../middlewares/uploads");


router.post(
  "/create",
  // validatePreferences,
  cloudinaryUpload.single("file"),
  controller.create
);
router.put(
  "/update",
  // validateUpdatePreferences,
  cloudinaryUpload.single("file"),
  controller.update
);
router.get("/get/:id", controller.get);
router.get("/getAllPreferencesByType/:type", controller.getAllPreferencesByType);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);
router.delete("/deleteAllPreferenceByType/:type", controller.deleteAllPreferenceByType);

module.exports = router;
