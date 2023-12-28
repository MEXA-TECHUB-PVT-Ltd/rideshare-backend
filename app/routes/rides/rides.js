const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/rides/rides");
const { validatePublishRide, validateJoinRide, validateUpdateStatus, validateStartRide } = require("../../middlewares/bodyValidations");

router.post("/publish_rides", validatePublishRide, controller.publishRides);
router.post("/join_rides", validateJoinRide, controller.joinRides);
router.put("/update_status", validateUpdateStatus, controller.updateStatus);
router.get("/search", controller.search);
router.get("/get/:id", controller.get);
router.get(
  "/getAllRideStatusByUsers/:user_id/:status",
  controller.getAllRideByStatus
);
router.get("/get_ride_joiners/:ride_id", controller.getRideJoiners);
router.get("/get_all_requested_rides", controller.getAllRequestedRides);
router.get("/get_all_publish_by_user/:user_id", controller.getAllPublishByUser);
router.get("/get_ride_joiners_by_user/:user_id", controller.getAllJoinedByUser);

module.exports = router;
