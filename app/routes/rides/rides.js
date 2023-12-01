const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/rides/rides");
const { validatePublishRide } = require("../../middlewares/bodyValidations");

router.post("/publish_rides", validatePublishRide, controller.publishRides);
router.get("/search", controller.search);
router.get("/get/:id", controller.get);

module.exports = router;
