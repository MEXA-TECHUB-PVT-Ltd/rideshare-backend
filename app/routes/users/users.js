const express = require('express');
const router = express.Router();
// project file directories
const controller = require('../../controllers/users/users');
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
} = require("../../middlewares/bodyValidations");


router.post('/create', validateUser, controller.create);
router.post("/signIn", validateSignIn, controller.signIn);
router.post("/forgotPassword", validateForgotPassword, controller.forgotPassword);
router.post("/verify_otp", validateVerifyCode, controller.verify_otp);
router.put('/update', validateUpdateUser, controller.update);
router.put("/resetPassword", validateResetPassword, controller.resetPassword);
router.put("/updatePassword", validateUpdatePassword, controller.updatePassword);
router.put("/updateBlockStatus", validateUpdateBlockStatus, controller.updateBlockStatus);
router.put(
  "/updateDeactivateStatus",
  validateUpdateDeactivateStatus,
  controller.updateDeactivateStatus
);
router.get('/getAll', queryValidation, controller.getAll);
router.get('/getAllBlockUsers', queryValidation, controller.getAllBlockUsers);
router.get('/get/:id', controller.get);
router.get("/search", queryValidation, controller.search);
router.delete("/delete/:id", controller.delete);
router.delete('/deleteAll', controller.deleteAll);
// router.get("/search", validateUsersSearchTerm, controller.search);


module.exports = router;
