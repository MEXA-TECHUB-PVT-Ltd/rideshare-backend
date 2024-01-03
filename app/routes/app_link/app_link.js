const express = require("express");
const router = express.Router();
const controller = require("../../controllers/app_link/app_link");
const {
  validateAppLink, queryValidation,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateAppLink, controller.create);
router.get("/get/:id", controller.get);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
