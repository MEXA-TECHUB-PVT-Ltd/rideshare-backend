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
const searchNotifications = require("./notifications/search_ride_notifications");
const notifications = require("./notifications/notifications");
const fav_riders = require("./fav_riders/fav_riders");
const contact_us = require("./contact_us/contact_us");
const notification_types = require("./notification_types/notification_types");
const rating = require("./rating/rating");
const bank_details = require("./bank_details/bank_details");
const complaints = require("./complaints/complaints");
const preferences = require("./preferences/preferences");
const user_preferences = require("./user_preferences/user_preferences");
const app_link = require("./app_link/app_link");
const payments = require("./payments/payments");
const driver_verification_request = require("./driver_verification_request/driver_verification_request");

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
router.use("/notifications/search_ride", searchNotifications);
router.use("/notifications", notifications);
router.use("/fav_riders", fav_riders);
router.use("/fav_riders", fav_riders);
router.use("/contact_us", contact_us);
router.use("/contact_us", contact_us);
router.use("/notification_types", notification_types);
router.use("/notification_types", notification_types);
router.use("/rating", rating);
router.use("/bank_details", bank_details);
router.use("/bank_details", bank_details);
router.use("/complaints", complaints);
router.use("/preferences", preferences);
router.use("/user_preferences", user_preferences);
router.use("/app_link", app_link);
router.use("/payments", payments);
router.use("/driver_verification_request", driver_verification_request);

module.exports = router;
