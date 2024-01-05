const { createUsersSchema, getAllUsersSchema, usersSearchValidationSchema, updateUsersSchema, signInSchema, forgotPasswordSchema, resetPasswordSchema, updatePasswordSchema, updateBlockStatusSchema, deactivateStatusSchema, vehicleDetailsSchema, updateVehicleDetailsSchema, createCautionSchema, updateCautionSchema, createPRSchema, updatePRSchema, updateDRSchema, createDRSchema, createCarColSchema, updateCarColSchema, publishRidesSchema, createVTSchema, updateVTSchema, searchNotificationsSchema, updateSearchNotificationsSchema, verifyCodeSchema, favRidersSchema, updateFavRidersSchema, contactSchema, updateContactSchema, updateStatusContactSchema, notificationTypesSchema, updateNotificationTypesSchema, joinRidesSchema, updateStatusSchema, startRideSchema, ratingSchema, bankDetailSchema, updateBankDetailSchema, complaintSchema, updateComplaintSchema, updatePreferencesSchema, preferencesSchema, delPreferencesSchema, appLinkSchema, updateInsSchema } = require("../lib/validation.dto");


//  ?? user module
exports.validateUser = (req, res, next) => {
  const { error } = createUsersSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }
  next();
};
exports.validateUpdateUser = (req, res, next) => {
  const { error } = updateUsersSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateUserIns = (req, res, next) => {
  const { error } = updateInsSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateDeletePreferences = (req, res, next) => {
  const { error } = delPreferencesSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateSignIn = (req, res, next) => {
  const { error } = signInSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateForgotPassword = (req, res, next) => {
  const { error } = forgotPasswordSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateVerifyCode = (req, res, next) => {
  const { error } = verifyCodeSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateResetPassword = (req, res, next) => {
  const { error } = resetPasswordSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdatePassword = (req, res, next) => {
  const { error } = updatePasswordSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateBlockStatus = (req, res, next) => {
  const { error } = updateBlockStatusSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateDeactivateStatus = (req, res, next) => {
  const { error } = deactivateStatusSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};

// vehicles details
exports.validateVehicleDetailsSchema = (req, res, next) => {
  const { error } = vehicleDetailsSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateVehicleDetailsSchema = (req, res, next) => {
  const { error } = updateVehicleDetailsSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};


exports.queryValidation = (req, res, next) => {
  const { error } = getAllUsersSchema.validate(req.query);

  if (error) {
    return res
      .status(400)
      .json({ status: false, message: error.details[0].message });
  }

  next();
};

exports.validateUsersSearchTerm = (req, res, next) => {
  const { error } = usersSearchValidationSchema.validate(req.query);
  if (error) {
    return res
      .status(400)
      .json({ status: false, message: error.details[0].message });
  }
  next();
};


// cautions
exports.validateCreateCautions = (req, res, next) => {
  const { error } = createCautionSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateCautions = (req, res, next) => {
  const { error } = updateCautionSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};


// passenger  rates
exports.validateCreatePR = (req, res, next) => {
  const { error } = createPRSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdatePR = (req, res, next) => {
  const { error } = updatePRSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
// driver rates 
exports.validateCreateDR = (req, res, next) => {
  const { error } = createDRSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateDR = (req, res, next) => {
  const { error } = updateDRSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};

// car colors
exports.validateCreateCarCol = (req, res, next) => {
  const { error } = createCarColSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateCarCol = (req, res, next) => {
  const { error } = updateCarColSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};


// rides
exports.validatePublishRide = (req, res, next) => {
  const { error } = publishRidesSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateJoinRide = (req, res, next) => {
  const { error } = joinRidesSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateStatus = (req, res, next) => {
  const { error } = updateStatusSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateStartRide = (req, res, next) => {
  const { error } = startRideSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};



// vehicles types
exports.validateCreateVT = (req, res, next) => {
  const { error } = createVTSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateVT = (req, res, next) => {
  const { error } = updateVTSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};

// search notifications 
exports.validateSearchNotifications = (req, res, next) => {
  const { error } = searchNotificationsSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateSearchNotifications = (req, res, next) => {
  const { error } = updateSearchNotificationsSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};


// fav riders

exports.validateFavRiders = (req, res, next) => {
  const { error } = favRidersSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateFavRiders = (req, res, next) => {
  const { error } = updateFavRidersSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};

// contact us

exports.validateContactUs = (req, res, next) => {
  const { error } = contactSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateContactUs = (req, res, next) => {
  const { error } = updateContactSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateStatusContactUs = (req, res, next) => {
  const { error } = updateStatusContactSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};

// notification types
exports.validateNT = (req, res, next) => {
  const { error } = notificationTypesSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateNT = (req, res, next) => {
  const { error } = updateNotificationTypesSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};

// rating
exports.validateRating = (req, res, next) => {
  const { error } = ratingSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
// bank_details
exports.validateBankDetail = (req, res, next) => {
  const { error } = bankDetailSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdateBankDetail = (req, res, next) => {
  const { error } = updateBankDetailSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};


// complaint
exports.validateComplaint = (req, res, next) => {
  const { error } = complaintSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};

exports.validateUpdateComplaint = (req, res, next) => {
  const { error } = updateComplaintSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};

// preferences
exports.validatePreferences = (req, res, next) => {
  const { error } = preferencesSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
exports.validateUpdatePreferences = (req, res, next) => {
  const { error } = updatePreferencesSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};
// app link
exports.validateAppLink = (req, res, next) => {
  const { error } = appLinkSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({
      status: false,
      message: "Validation error",
      details: errorMessage,
    });
  }

  next();
};

