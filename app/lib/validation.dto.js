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
  role: Joi.string().optional().valid("user", "admin"),
});
exports.signInSchema = Joi.object({
  type: Joi.string().valid("email", "facebook").required(),
  email: Joi.string().email().required(),
  password: Joi.string().when("type", { is: "email", then: Joi.required() }),
  device_id: Joi.string().required(),
  role: Joi.string().optional().valid("user", "admin"),
  // facebook_access_token: Joi.string().when("type", {
  //   is: "facebook",
  //   then: Joi.optional(),
  // }),
});

exports.updateUsersSchema = Joi.object()
  .keys({
    id: Joi.number().required(),
  })
  .pattern(Joi.string(), Joi.any().optional());

exports.updateInsSchema = Joi.object({
  user_id: Joi.number().required(),
  status: Joi.string().required().valid("contacted", "pending"),
});

exports.delPreferencesSchema = Joi.object({
  user_id: Joi.number().required(),
  chattiness_preference_id: Joi.number().optional(),
  music_preference_id: Joi.number().optional(),
  smoking_preference_id: Joi.number().optional(),
  pets_preference_id: Joi.number().optional(),
}).or(
  "chattiness_preference_id",
  "music_preference_id",
  "smoking_preference_id",
  "pets_preference_id"
);

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().optional().valid("user", "admin"),
});
exports.verifyCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.number().required(),
  role: Joi.string().optional().valid("user", "admin"),
  type: Joi.string().required().valid("signup", "forgot_password"),
});
exports.resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  new_password: Joi.string().min(5).required(),
  role: Joi.string().optional().valid("user", "admin"),
});
exports.updatePasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  old_password: Joi.string().required(),
  new_password: Joi.string().min(5).required(),
  role: Joi.string().optional().valid("user", "admin"),
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
  sortField: Joi.string().valid("id", "name", "created_at"),
  sortOrder: Joi.string().valid("asc", "desc", "created_at"),
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
});
exports.updateCautionSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
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
  vehicles_details_id: Joi.number().required(),
  return_ride_status: Joi.boolean(),
  return_ride_id: Joi.number().when("return_ride_status", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

exports.joinRidesSchema = Joi.object({
  user_id: Joi.number().required(),
  ride_id: Joi.number().required(),
  price_per_seat: Joi.number().required(),
  price_offer: Joi.number().required(),
  pickup_location: Joi.string().required(),
  drop_off_location: Joi.string().required(),
  total_distance: Joi.string().required(),
  pickup_time: Joi.string().required(),
  no_seats: Joi.number().required(),
});
exports.updateStatusSchema = Joi.object({
  id: Joi.number().required(),
  status: Joi.string().required().valid("accepted", "rejected"),
});
exports.startRideSchema = Joi.object({
  ride_id: Joi.number().required(),
  ride_status: Joi.string().required(),
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

// fav riders
exports.favRidersSchema = Joi.object({
  user_id: Joi.number().required(),
  rider_id: Joi.number().required(),
});
exports.updateFavRidersSchema = Joi.object({
  id: Joi.number().required(),
  user_id: Joi.number().required(),
  rider_id: Joi.number().required(),
});

// contact us
exports.contactSchema = Joi.object({
  email: Joi.string().email().required(),
  full_name: Joi.string().required(),
  message: Joi.string().required(),
});
exports.updateContactSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  full_name: Joi.string().required(),
  message: Joi.string().required(),
});
exports.updateStatusContactSchema = Joi.object({
  id: Joi.number().required(),
  status: Joi.string().required().valid("contacted", "dismissed", "pending"),
});

// notification_types
exports.notificationTypesSchema = Joi.object({
  name: Joi.string().required(),
});
exports.updateNotificationTypesSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
});
// rating
exports.ratingSchema = Joi.object({
  user_id: Joi.number().required(),
  ride_id: Joi.number().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().required(),
});
// bank_details
exports.bankDetailSchema = Joi.object({
  user_id: Joi.number().required(),
  cardholder_name: Joi.string().required(),
  card_number: Joi.string().creditCard().required(),
  expiry_date: Joi.string()
    .pattern(/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/)
    .required(),
  cvv: Joi.string()
    .pattern(/^[0-9]{3,4}$/)
    .required(),
});
exports.updateBankDetailSchema = Joi.object({
  id: Joi.number().required(),
  user_id: Joi.number().required(),
  cardholder_name: Joi.string().required(),
  card_number: Joi.string().creditCard().required(),
  expiry_date: Joi.string()
    .pattern(/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/)
    .required(),
  cvv: Joi.string()
    .pattern(/^[0-9]{3,4}$/)
    .required(),
});

// complaint
exports.complaintSchema = Joi.object({
  rider_id: Joi.number().required(),
  user_id: Joi.number().required(),
  reason: Joi.string().required(),
});
exports.updateComplaintSchema = Joi.object({
  id: Joi.number().required(),
  rider_id: Joi.number().required(),
  user_id: Joi.number().required(),
  reason: Joi.string().required(),
});

// preferences
exports.preferencesSchema = Joi.object({
  type: Joi.string().required().valid("chattiness", "music", "smoking", "pets"),
  prompt: Joi.string().required(),
});
exports.updatePreferencesSchema = Joi.object({
  id: Joi.number().required(),
  type: Joi.string().required().valid("chattiness", "music", "smoking", "pets"),
  prompt: Joi.string().required(),
});

// queries
exports.appLinkSchema = Joi.object({
  url: Joi.string()
    .uri({ scheme: ["http", "https"] }) // Validates for 'http' and 'https' URLs
    .required()
    .messages({
      "string.base": `"url" should be a type of 'text'`,
      "string.empty": `"url" cannot be an empty field`,
      "string.uri": `"url" must be a valid URL`,
      "any.required": `"url" is a required field`,
    }),
});



exports.validateFile = (file) => {
  if (!file) {
    throw new Error("FileError");
  }
};
