const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/driver_rates/driver_rates");
const {
  queryValidation,
  validateCreateDR,
  validateUpdateDR,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateCreateDR, controller.create);
router.put("/update", validateUpdateDR, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
