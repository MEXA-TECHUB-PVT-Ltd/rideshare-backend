const express = require("express");
const router = express.Router();
const controller = require("../../controllers/universal/universal");
const { upload } = require("../../middlewares/uploads");

router.post("/uploads", upload.single("file"), controller.upload);
router.get("/getAllCount", controller.getAllCount);

module.exports = router;
