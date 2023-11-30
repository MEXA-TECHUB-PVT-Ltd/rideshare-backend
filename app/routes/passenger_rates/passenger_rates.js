const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/passenger_rates/passenger_rates");
const {
  queryValidation,
  validateCreatePR,
  validateUpdatePR,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateCreatePR, controller.create);
router.put("/update", validateUpdatePR, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
