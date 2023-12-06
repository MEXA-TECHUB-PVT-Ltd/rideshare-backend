const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/contact_us/contact_us");
const {
  queryValidation,
  validateContactUs,
  validateUpdateContactUs,
  validateUpdateStatusContactUs,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateContactUs, controller.create);
router.put("/update", validateUpdateContactUs, controller.update);
router.put("/updateStatus", validateUpdateStatusContactUs, controller.updateStatus);
router.get("/get/:id", controller.get);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
