const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/driver_verification_request/driver_verification_request");
const {
  validateDriverVerification, queryValidation, validateUpdateDriverVerification,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateDriverVerification, controller.create);
router.patch("/update", validateUpdateDriverVerification, controller.update);
router.get("/getAll", queryValidation, controller.getAll);
router.get("/get/:id", queryValidation, controller.get);
router.get("/getByUser/:user_id", queryValidation, controller.getByUser);
router.get("/getOneByUser/:userId", queryValidation, controller.getOneByUser);

module.exports = router;
