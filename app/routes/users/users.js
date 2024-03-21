const express = require("express");
const router = express.Router();
// project file directories
const controller = require("../../controllers/users/users");
const {
  validateUser,
  validateUpdateUser,
  queryValidation,
  validateUsersSearchTerm,
  validateSignIn,
  validateForgotPassword,
  validateResetPassword,
  validateUpdatePassword,
  validateUpdateBlockStatus,
  validateUpdateDeactivateStatus,
  validateVerifyCode,
  validateDeletePreferences,
  validateUpdateUserIns,
  validateVerifyDriver,
} = require("../../middlewares/bodyValidations");

router.post("/create", validateUser, controller.create);
router.post("/signIn", validateSignIn, controller.signIn);
router.post(
  "/forgotPassword",
  validateForgotPassword,
  controller.forgotPassword
);
router.post("/verify_otp", validateVerifyCode, controller.verify_otp);
router.put("/update", validateUpdateUser, controller.update);
router.put(
  "/deleteUserPreferences",
  validateDeletePreferences,
  controller.nullifyUserPreference
);
router.put("/resetPassword", validateResetPassword, controller.resetPassword);
router.put(
  "/updatePassword",
  validateUpdatePassword,
  controller.updatePassword
);
router.put(
  "/updateBlockStatus",
  validateUpdateBlockStatus,
  controller.updateBlockStatus
);
router.put(
  "/updateInsuranceStatus",
  validateUpdateUserIns,
  controller.updateInsuranceStatus
);
router.put(
  "/updateDeactivateStatus",
  validateUpdateDeactivateStatus,
  controller.updateDeactivateStatus
);
router.patch(
  "/verifyDriver",
  validateVerifyDriver,
  controller.verifyDriver
);
router.get("/getAll", queryValidation, controller.getAll);
router.get("/getAllBlockUsers", queryValidation, controller.getAllBlockUsers);
router.get(
  "/getAllRecentlyDeleted",
  queryValidation,
  controller.getAllRecentlyDeletedUsersWithDetails
);
router.get(
  "/getAllUsersWithDetails",
  queryValidation,
  controller.getAllUsersWithDetails
);
router.get("/get/:id", controller.get);
router.get("/getUserWithDetails/:id", controller.getUserWithDetails);
router.get(
  "/getAllUserByInsuranceStatus/:insurance_status",
  controller.getAllUserByInsuranceStatus
);
router.get("/search", queryValidation, controller.search);
router.delete("/delete/:id", controller.delete);
router.delete("/deleteAll", controller.deleteAll);
router.get("/getGraphicalRepresent", controller.getGraphicalRepresent);
// router.get("/search", validateUsersSearchTerm, controller.search);

module.exports = router;
