const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/cautions/cautions");
const {
  validateCreateCautions, validateUpdateCautions, queryValidation,
} = require("../../middlewares/bodyValidations");
const { cloudinaryUpload } = require("../../middlewares/uploads");

router.post(
  "/create",
  cloudinaryUpload.single("file"),
  controller.create
);
router.put("/update", 
  cloudinaryUpload.single("file"),
  controller.update);
router.get("/get/:id", controller.get);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
