const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/payments/payments");

router.post("/pay", controller.pay);
router.post("/withdraw", controller.withdraw);
router.post("/breakPaymentThroughWallet", controller.breakPaymentThroughWallet);
router.all("/paypal-webhook", controller.paypalWebhook);
router.get("/getTransactionHistory/:userId", controller.getTransactionHistory);
router.get("/getAdminTransactionHistory", controller.getAdminTransactionHistory);
router.get("/getAllTransactionHistory", controller.getAllTransactionHistory);
router.get("/getAdminWallet", controller.getAdminWallet);
router.get("/getUserWallet/:userId", controller.getUserWallet);

module.exports = router;
