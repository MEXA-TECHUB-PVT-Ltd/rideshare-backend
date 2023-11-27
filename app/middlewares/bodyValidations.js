const { createUsersSchema, getAllUsersSchema, usersSearchValidationSchema, updateUsersSchema, signInSchema, forgotPasswordSchema, resetPasswordSchema, updatePasswordSchema, updateBlockStatusSchema, deactivateStatusSchema, vehicleDetailsSchema, updateVehicleDetailsSchema } = require("../lib/validation.dto");


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


