const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/notifications/search_ride_notifications");
const {
  queryValidation,
  validateSearchNotifications,
  validateUpdateSearchNotifications,
} = require("../../middlewares/bodyValidations");

router.post(
  "/create",
  validateSearchNotifications,
  controller.create
);
router.put("/update", validateUpdateSearchNotifications, controller.update);
router.get("/get/:id", controller.get);
router.get("/getAll", queryValidation, controller.getAll);
router.get("/getAllByUser/:user_id", controller.getAllByUser);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
