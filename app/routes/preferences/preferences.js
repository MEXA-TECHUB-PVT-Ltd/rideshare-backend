const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/preferences/preferences");
const {
  queryValidation,
  validateUpdatePreferences,
  validatePreferences,
} = require("../../middlewares/bodyValidations");

router.post("/create", validatePreferences, controller.create);
router.put("/update", validateUpdatePreferences, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAllPreferencesByType/:type", controller.getAllPreferencesByType);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);
router.delete("/deleteAllPreferenceByType/:type", controller.deleteAllPreferenceByType);

module.exports = router;
