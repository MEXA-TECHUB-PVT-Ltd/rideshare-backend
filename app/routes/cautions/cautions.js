const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/cautions/cautions");
const {
  validateCreateCautions, validateUpdateCautions, queryValidation,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateCreateCautions, controller.create);
router.put("/update", validateUpdateCautions, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
