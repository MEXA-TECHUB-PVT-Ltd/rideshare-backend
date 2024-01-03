const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/bank_details/bank_details");
const {
  queryValidation,
  validateBankDetail,
  validateUpdateBankDetail,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateBankDetail, controller.create);
router.put("/update", validateUpdateBankDetail, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAllByUser/:user_id", controller.getAllByUser);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
