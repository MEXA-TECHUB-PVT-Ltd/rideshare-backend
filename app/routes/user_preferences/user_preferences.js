const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/user_preferences/user_preferences");
const {
  queryValidation,
  validateRating,
} = require("../../middlewares/bodyValidations");

router.post("/create", controller.create);
// router.put("/update", controller.update);
// router.get("/get/:id", controller.get);
// router.get(
//   "/getAllRatingsGivenByUser/:user_id",
//   queryValidation,
//   controller.getAllRatingsGivenByUser
// );
// router.get(
//   "/getAllRatingsByRide/:ride_id",
//   queryValidation,
//   controller.getAllRatingsByRide
// );
// router.get(
//   "/getAllRatingsOfUser/:user_id",
//   queryValidation,
//   controller.getAllRatingsOfUser
// );
// router.delete("/delete/:id", controller.delete);
// router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
