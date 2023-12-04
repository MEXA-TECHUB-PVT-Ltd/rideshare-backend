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
  password: Joi.string().when("type", { is: "email", then: Joi.required() }),
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
exports.verifyCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.number().required(),
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
  sortField: Joi.string().valid("id", "name"),
  query: Joi.string(),
});

// vehicles_details

exports.vehicleDetailsSchema = Joi.object({
  user_id: Joi.number().required(),
  license_plate_no: Joi.string().required(),
  vehicle_brand: Joi.object().required(),
  vehicle_model: Joi.object().required(),
  registration_no: Joi.string().required(),
  driving_license_no: Joi.string().required(),
  license_expiry_date: Joi.date().required(),
  personal_insurance: Joi.boolean().required(),
  vehicle_type_id: Joi.number().required(),
  vehicle_color_id: Joi.number().required(),
});
exports.updateVehicleDetailsSchema = Joi.object()
  .keys({
    id: Joi.number().required(),
  })
  .pattern(Joi.string(), Joi.any().optional());

// cautions
exports.createCautionSchema = Joi.object({
  name: Joi.string().required(),
  uploaded_icon_id: Joi.number().required(),
});
exports.updateCautionSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  uploaded_icon_id: Joi.number().required(),
});

// passenger_rates
exports.createPRSchema = Joi.object({
  rate: Joi.number().required(),
});
exports.updatePRSchema = Joi.object({
  id: Joi.number().required(),
  rate: Joi.number().required(),
});
// driver_rates
exports.createDRSchema = Joi.object({
  start_range: Joi.number().required(),
  end_range: Joi.number().required(),
  rate_per_mile: Joi.number().required(),
});
exports.updateDRSchema = Joi.object({
  id: Joi.number().required(),
  start_range: Joi.number().required(),
  end_range: Joi.number().required(),
  rate_per_mile: Joi.number().required(),
});

// vehicle colors
exports.createCarColSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
});
exports.updateCarColSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  code: Joi.string().required(),
});

// vehicle types
exports.createVTSchema = Joi.object({
  name: Joi.string().required(),
});
exports.updateVTSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
});

// rides
exports.publishRidesSchema = Joi.object({
  user_id: Joi.number().required(),
  pickup_location: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    address: Joi.string().optional(),
  }).required(),
  drop_off_location: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    address: Joi.string().optional(),
  }).required(),
  pickup_address: Joi.string().required(),
  drop_off_address: Joi.string().required(),
  tolls: Joi.boolean(),
  route_time: Joi.string().required(),
  city_of_route: Joi.string().required(),
  route_miles: Joi.number().precision(2).required(),
  ride_date: Joi.date().iso().required(),
  time_to_pick_up_passengers: Joi.string().required(),
  cautions: Joi.array().items(Joi.number().integer()),
  max_passengers: Joi.number().integer().min(1).required(),
  request_option: Joi.string().valid("instant", "review").required(),
  price_per_seat: Joi.number().precision(2).required(),
  return_ride_status: Joi.boolean(),
});


// notifications
// search notifications handling on new ride created on same data

exports.searchNotificationsSchema = Joi.object({
  email: Joi.string().email().required(),
  pickup_location: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    address: Joi.string().optional(),
  }).required(),
  drop_off_location: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    address: Joi.string().optional(),
  }).required(),
  drop_off_address: Joi.string().required(),
  pickup_address: Joi.string().required(),
});
exports.updateSearchNotificationsSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  pickup_location: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    address: Joi.string().optional(),
  }).required(),
  drop_off_location: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    address: Joi.string().optional(),
  }).required(),
  drop_off_address: Joi.string().required(),
  pickup_address: Joi.string().required(),
});