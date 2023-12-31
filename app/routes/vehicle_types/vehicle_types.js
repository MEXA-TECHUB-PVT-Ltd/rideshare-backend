const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/vehicle_types/vehicle_types");
const {
  queryValidation,
  validateUpdateVT,
  validateCreateVT,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateCreateVT, controller.create);
router.put("/update", validateUpdateVT, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
