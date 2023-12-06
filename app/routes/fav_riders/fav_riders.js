const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/fav_riders/fav_riders");
const {
  queryValidation,
  validateCreatePR,
  validateUpdatePR,
  validateFavRiders,
  validateUpdateFavRiders,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateFavRiders, controller.create);
// router.put("/update", validateUpdateFavRiders, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAllFavoriteRiders/:user_id", controller.getAllFavoriteRiders);
router.get("/getAll", queryValidation, controller.getAll);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
