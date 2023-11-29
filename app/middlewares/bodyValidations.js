const { createUsersSchema, getAllUsersSchema, usersSearchValidationSchema, updateUsersSchema, signInSchema, forgotPasswordSchema, resetPasswordSchema, updatePasswordSchema, updateBlockStatusSchema, deactivateStatusSchema, vehicleDetailsSchema, updateVehicleDetailsSchema, createCautionSchema, updateCautionSchema, createPRSchema, updatePRSchema, updateDRSchema, createDRSchema, createCarColSchema, updateCarColSchema, publishRidesSchema, createVTSchema, updateVTSchema } = require("../lib/validation.dto");


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
