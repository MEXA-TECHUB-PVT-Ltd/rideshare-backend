const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/payments/payments");

router.post("/pay", controller.pay);
router.all("/paypal-webhook", controller.paypalWebhook);

module.exports = router;
