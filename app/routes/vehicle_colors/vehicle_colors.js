const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/vehicle_colors/vehicle_colors");
const {
  queryValidation,
  validateCreateCarCol,
  validateUpdateCarCol,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateCreateCarCol, controller.create);
router.put("/update", validateUpdateCarCol, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAll", queryValidation, controller.getAll);
router.get("/search", queryValidation, controller.search);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
