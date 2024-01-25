const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/complaints/complaints");
const {
  queryValidation,
  validateComplaint,
  validateUpdateComplaint,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateComplaint, controller.create);
router.put("/update", validateUpdateComplaint, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAll", queryValidation, controller.getAll);
router.get(
  "/getAllComplaintsByUser/:user_id",
  queryValidation,
  controller.getAllComplaintsByUser
);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);
router.delete(
  "/deleteAllComplaintsByUser/:user_id",
  controller.deleteAllComplaintsByUser
);

module.exports = router;
