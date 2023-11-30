const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/rides/rides");
const { validatePublishRide } = require("../../middlewares/bodyValidations");

router.post("/publish_rides", validatePublishRide, controller.publishRides);
router.get("/search", controller.search);

module.exports = router;
