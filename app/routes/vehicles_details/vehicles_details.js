const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/vehicles_details/vehicles_details");
const { validateVehicleDetailsSchema, validateUpdateVehicleDetailsSchema, queryValidation } = require("../../middlewares/bodyValidations");

router.post("/create", validateVehicleDetailsSchema, controller.create);
router.put("/update", validateUpdateVehicleDetailsSchema, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAllByUser/:user_id", controller.getAllByUser);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
