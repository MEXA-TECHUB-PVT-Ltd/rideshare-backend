const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/notification_types/notification_types");
const {
  queryValidation,
  validateNT,
  validateUpdateNT,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateNT, controller.create);
router.put("/update", validateUpdateNT, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
