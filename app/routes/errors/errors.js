const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/errors/errors");
const {
  validateDriverVerification,
  queryValidation,
  validateUpdateDriverVerification,
} = require("../../middlewares/bodyValidations");

router.get("/getWithdrawErrors", queryValidation, controller.withdrawErrors);

module.exports = router;
