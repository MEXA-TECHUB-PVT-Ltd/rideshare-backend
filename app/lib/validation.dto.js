const Joi = require("joi");


// Users
exports.createUsersSchema = Joi.object({
  type: Joi.string().valid("email", "facebook").required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(5)
    .when("type", { is: "email", then: Joi.required() }),
  facebook_access_token: Joi.string().when("type", {
    is: "facebook",
    then: Joi.required(),
  }),
  device_id: Joi.string().required(),
});
exports.signInSchema = Joi.object({
  type: Joi.string().valid("email", "facebook").required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .when("type", { is: "email", then: Joi.required() }),
  facebook_access_token: Joi.string().when("type", {
    is: "facebook",
    then: Joi.required(),
  }),
});

exports.updateUsersSchema = Joi.object()
.keys({
  id: Joi.number().required(),
})
.pattern(Joi.string(), Joi.any().optional());

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});
exports.resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  new_password: Joi.string().min(5).required(),
});
exports.updatePasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  old_password: Joi.string().required(),
  new_password: Joi.string().min(5).required(),
});
exports.updateBlockStatusSchema = Joi.object({
  id: Joi.number().required(),
  block_status: Joi.boolean().required(),
});
exports.deactivateStatusSchema = Joi.object({
  id: Joi.number().required(),
  deactivated: Joi.boolean().required(),
});
exports.getAllUsersSchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1),
  sortField: Joi.string().valid("id", "name"),
  sortOrder: Joi.string().valid("asc", "desc"),
});


// vehicles_details

exports.vehicleDetailsSchema = Joi.object({
  user_id: Joi.number().required(),
  license_plate_no: Joi.string().required(),
  vehicle_brand: Joi.string().required(),
  vehicle_model: Joi.string().required(),
  registration_no: Joi.string().required(),
  driving_license_no: Joi.string().required(),
  license_expiry_date: Joi.date().required(),
  personal_insurance: Joi.boolean().required(),

  vehicle_type: Joi.array().items(Joi.string()).required(),
  vehicle_color: Joi.array().items(Joi.string()).required(),
});
exports.updateVehicleDetailsSchema = Joi.object()
  .keys({
    id: Joi.number().required(),
  })
  .pattern(Joi.string(), Joi.any().optional());

