const express = require("express");
const router = express.Router();
const controller = require("../../controllers/queries/queries");
const {
  validateUpdateQueries,
  validateQueries,
} = require("../../middlewares/bodyValidations");

// router.post("/create", validateQueries, controller.add);
// router.put("/update", validateUpdateQueries, controller.update);
// router.get("/get/:id", controller.get);
// router.get("/getAll", queryValidation, controller.getAll);
// router.delete("/delete/:id", controller.delete);
// router.delete("/deleteAll", controller.deleteAll);

module.exports = router;
