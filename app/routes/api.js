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
const fav_riders = require("./fav_riders/fav_riders");
const contact_us = require("./contact_us/contact_us");
const notification_types = require("./notification_types/notification_types");
const rating = require("./rating/rating");

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
router.use("/fav_riders", fav_riders);
router.use("/fav_riders", fav_riders);
router.use("/contact_us", contact_us);
router.use("/contact_us", contact_us);
router.use("/notification_types", notification_types);
router.use("/notification_types", notification_types);
router.use("/rating", rating);

module.exports = router;
