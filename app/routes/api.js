const express = require("express");
const router = express.Router();
// project files directories
const users = require("./users/users");
const vehicles_details = require("./vehicles_details/vehicles_details");
const cautions = require("./cautions/cautions");
const universal = require("./universal/universal");
const passenger_rates = require("./passenger_rates/passenger_rates");
const driver_rates = require("./driver_rates/driver_rates");
const vehicle_colors = require("./vehicle_colors/vehicle_colors");
const rides = require("./rides/rides");
const vehicle_types = require("./vehicle_types/vehicle_types");
const notifications = require("./notifications/search_ride_notifications");

router.use("/users", users);
router.use("/vehicles_details", vehicles_details);
router.use("/vehicles_details", vehicles_details);
router.use("/cautions", cautions);
router.use("/universal", universal);
router.use("/universal", universal);
router.use("/passenger_rates", passenger_rates);
router.use("/driver_rates", driver_rates);
router.use("/vehicle_colors", vehicle_colors);
router.use("/rides", rides);
router.use("/vehicle_types", vehicle_types);
router.use("/notifications/search_ride", notifications);

module.exports = router;
