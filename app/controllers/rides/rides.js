// external libraries

// project files
const { responseHandler } = require("../../utils/commonResponse");
const {
  createRecord,
  getSingle,
  updateRecord,
  getAll,
} = require("../../utils/dbHeplerFunc");
const { checkUserExists } = require("../../utils/dbValidations");
const { notifyUsersForNewRide } = require("../../utils/notifyEmailOnNewRide");
const { pool } = require("../../config/db.config");
const { COORDINATE_THRESHOLD } = require("../../constants/constants");
const { getIo } = require("../../config/socketSetup");
const {
  rideDataForEjs,
  renderEJSTemplate,
  rideEmailTemplatePath,
} = require("../../utils/renderEmail");
const sendEmail = require("../../lib/sendEmail");
// const { io } = require("../../config/socketSetup");

exports.publishRides = async (req, res) => {
  const {
    user_id,
    pickup_location: { latitude: pickupLat, longitude: pickupLong },
    pickup_address,
    drop_off_location: { latitude: dropOffLat, longitude: dropOffLong },
    drop_off_address,
    tolls,
    route_time,
    city_of_route,
    route_miles,
    ride_date,
    time_to_pick_up_passengers,
    cautions,
    max_passengers,
    request_option,
    price_per_seat,
    return_ride_status,
    vehicles_details_id,
  } = req.body;
  const pickupPoint = `(${pickupLat}, ${pickupLong})`;
  const dropOffPoint = `(${dropOffLat}, ${dropOffLong})`;
  const rideData = {
    user_id,
    pickup_location: pickupPoint,
    pickup_address: pickup_address,
    drop_off_location: dropOffPoint,
    drop_off_address,
    tolls,
    route_time,
    city_of_route,
    route_miles,
    ride_date,
    time_to_pickup: time_to_pick_up_passengers,
    cautions: cautions,
    max_passengers,
    request_option,
    price_per_seat,
    return_ride_status,
    vehicles_details_id,
  };

  try {
    const userExists = await checkUserExists("users", "id", user_id, [{column: "deleted_at", value: "IS NULL"}]);
    if (userExists.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found or deactivated");
    }

    const vehicleExists = await checkUserExists(
      "vehicles_details",
      "id",
      vehicles_details_id
    );
    if (vehicleExists.rowCount === 0) {
      return responseHandler(res, 404, false, "vehicle_details not found");
    }

    notifyUsersForNewRide(rideData);
    const createResult = await createRecord("rides", rideData, []);

    if (createResult.error) {
      return responseHandler(
        res,
        createResult.status,
        false,
        createResult.message
      );
    }

    // Fetch the ride details along with vehicle type and color
    const rideId = createResult.data.id; // Assuming the ID of the new record is returned in the result
    const rideDetailsQuery = `
      SELECT rd.*,
       JSON_BUILD_OBJECT(
           'license_plate_no', vd.license_plate_no,
           'vehicle_details', JSON_BUILD_OBJECT(
               'brand', vd.vehicle_brand,
               'model', vd.vehicle_model,
               'registration_no', vd.registration_no,
               'driving_license_no', vd.driving_license_no,
               'license_expiry_date', vd.license_expiry_date,
               'personal_insurance', vd.personal_insurance
           ),
           'vehicle_type', JSON_BUILD_OBJECT(
               'name', vt.name
           ),
           'vehicle_color', JSON_BUILD_OBJECT(
               'name', vc.name,
               'code', vc.code
           )
       ) AS vehicle_info
FROM rides rd
JOIN vehicles_details vd ON rd.vehicles_details_id = vd.id
LEFT JOIN vehicle_types vt ON vd.vehicle_type_id = vt.id
LEFT JOIN vehicle_colors vc ON vd.vehicle_color_id = vc.id
WHERE rd.id = $1;
`;

    const rideDetailsResult = await pool.query(rideDetailsQuery, [rideId]);

    try {
      const rideData = rideDataForEjs();
      const rideHtmlContent = await renderEJSTemplate(
        rideEmailTemplatePath,
        rideData
      );
      const emailSent = await sendEmail(
        userExists.rows[0].email,
        "Ride Published",
        rideHtmlContent
      );

      if (!emailSent.success) {
        console.error(emailSent.message);
        // Consider whether you want to return here or just log the error
        return responseHandler(res, 500, false, emailSent.message);
      }
    } catch (sendEmailError) {
      console.error(sendEmailError);
      return responseHandler(
        res,
        500,
        false,
        "Error sending verification email"
      );
    }

    if (rideDetailsResult.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        "Ride details not found after creation"
      );
    }

    return responseHandler(
      res,
      201,
      true,
      "Ride details added successfully!",
      rideDetailsResult.rows[0]
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.search = async (req, res) => {
  try {
    const {
      pickup_location,
      drop_off_location,
      ride_date,
      max_passengers,
      max_price,
    } = req.query;

    // Fetch all rides
    const allRidesQuery = `      
SELECT 
  rides.*,
  JSON_BUILD_OBJECT(
    'license_plate_no', vehicles_details.license_plate_no,
    'vehicle_brand', vehicles_details.vehicle_brand,
    'vehicle_model', vehicles_details.vehicle_model,
    'vehicle_type', JSON_BUILD_OBJECT(
      'name', vehicle_types.name
    ),
    'vehicle_color', JSON_BUILD_OBJECT(
      'name', vehicle_colors.name,
      'code', vehicle_colors.code
    )
  ) AS vehicle_info
FROM 
  rides
JOIN 
  vehicles_details ON rides.vehicles_details_id = vehicles_details.id
JOIN 
  vehicle_types ON vehicles_details.vehicle_type_id = vehicle_types.id
JOIN 
  vehicle_colors ON vehicles_details.vehicle_color_id = vehicle_colors.id
JOIN 
  users ON rides.user_id = users.id AND users.deleted_at IS NULL;

`;
    const allRidesResult = await pool.query(allRidesQuery);
    const allRides = allRidesResult.rows;

    const filteredRides = allRides.filter((ride) => {
      let matchesCriteria = true;

      // Inside your filter function
      if (pickup_location) {
        const [pickupLat, pickupLong] = pickup_location
          .split(",")
          .map(parseFloat);
        const ridePickupLat = parseFloat(ride.pickup_location.x);
        const ridePickupLong = parseFloat(ride.pickup_location.y);

        matchesCriteria =
          matchesCriteria &&
          Math.abs(ridePickupLat - pickupLat) < COORDINATE_THRESHOLD &&
          Math.abs(ridePickupLong - pickupLong) < COORDINATE_THRESHOLD;
      }

      if (drop_off_location && matchesCriteria) {
        const [dropOffLat, dropOffLong] = drop_off_location
          .split(",")
          .map(parseFloat);
        const rideDropOffLat = parseFloat(ride.drop_off_location.x);
        const rideDropOffLong = parseFloat(ride.drop_off_location.y);

        // Debug log
        console.log(
          `Comparing Drop-off: (${dropOffLat}, ${dropOffLong}) with (${rideDropOffLat}, ${rideDropOffLong})`
        );

        matchesCriteria =
          matchesCriteria &&
          Math.abs(rideDropOffLat - dropOffLat) < COORDINATE_THRESHOLD &&
          Math.abs(rideDropOffLong - dropOffLong) < COORDINATE_THRESHOLD;
      }

      if (ride_date && matchesCriteria) {
        matchesCriteria =
          matchesCriteria && ride.ride_date.toISOString() === ride_date;
      }

      if (max_passengers && matchesCriteria) {
        matchesCriteria =
          matchesCriteria &&
          ride.max_passengers === parseInt(max_passengers, 10);
      }

      if (max_price && matchesCriteria) {
        matchesCriteria =
          matchesCriteria && ride.price_per_seat <= parseFloat(max_price);
      }

      return matchesCriteria;
    });

    return responseHandler(
      res,
      201,
      true,
      "Ride search successfully!",
      filteredRides
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.get = async (req, res) => {
  const join = `
    JOIN vehicles_details ON rides.vehicles_details_id = vehicles_details.id
    JOIN vehicle_types ON vehicles_details.vehicle_type_id = vehicle_types.id
    JOIN vehicle_colors ON vehicles_details.vehicle_color_id = vehicle_colors.id
    JOIN users ON rides.user_id = users.id AND users.deleted_at IS NULL
  `;

  const joinFields = `
    rides.*,
    JSON_BUILD_OBJECT(
      'license_plate_no', vehicles_details.license_plate_no,
      'vehicle_brand', vehicles_details.vehicle_brand,
      'vehicle_model', vehicles_details.vehicle_model,
      'registration_no', vehicles_details.registration_no,
      'driving_license_no', vehicles_details.driving_license_no,
      'license_expiry_date', vehicles_details.license_expiry_date,
      'personal_insurance', vehicles_details.personal_insurance,
      'vehicle_type', JSON_BUILD_OBJECT(
        'name', vehicle_types.name,
        'id', vehicles_details.vehicle_type_id
      ),
      'vehicle_color', JSON_BUILD_OBJECT(
        'name', vehicle_colors.name,
        'code', vehicle_colors.code,
        'id', vehicles_details.vehicle_color_id
      )
    ) AS vehicle_info
  `;

  // Include only the fields from the 'rides' table in the main selection
  return getSingle(req, res, "rides", "id", "rides.*", join, joinFields);
};

exports.joinRides = async (req, res) => {
  const { user_id, ride_id } = req.body;

  try {
    const user = await checkUserExists("users", "id", user_id, [
      { column: "deleted_at", value: "IS NULL" },
    ]);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found or deactivated");
    }
    const ride = await checkUserExists("rides", "id", ride_id);
    if (ride.rowCount === 0) {
      return responseHandler(res, 404, false, "Ride not found");
    }

    const rideData = ride.rows[0];
    let result;

    if (rideData.request_option === "instant") {
      // Logic for instant booking
      const updateRideQuery = `UPDATE rides SET current_passenger_count = current_passenger_count + 1 WHERE id = $1`;
      await pool.query(updateRideQuery, [ride_id]);
      const rideJoiner = {
        user_id,
        ride_id,
        status: "accepted",
      };
      result = await createRecord("ride_joiners", rideJoiner, []);
    } else {
      // Logic for rides that require review
      const rideJoiner = {
        user_id,
        ride_id,
        status: "pending",
      };
      result = await createRecord("ride_joiners", rideJoiner, []);
    }
    return responseHandler(
      res,
      201,
      true,
      "Ride joiner details added successfully!",
      result.data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.updateStatus = async (req, res) => {
  const { id, status } = req.body;

  const vehicleData = {
    status,
  };

  try {
    const user = await checkUserExists("ride_joiners", "id", id);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "joiner details not found");
    }
    const result = await updateRecord("ride_joiners", vehicleData, [], {
      column: "id",
      value: id,
    });


    if (status === "accepted") {
      const updateRideQuery = `UPDATE rides SET current_passenger_count = current_passenger_count + 1 WHERE id = $1`;
      await pool.query(updateRideQuery, [result.ride_id]);
    }

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      200,
      true,
      "ride_joiners status updated successfully!",
      result
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getRideJoiners = async (req, res) => {
  const ride_id  = parseInt(req.params.ride_id, 10);

  const join = `
    JOIN users u ON rj.user_id = u.id AND u.deleted_at IS NULL
    LEFT JOIN uploads up ON u.profile_picture = up.id
    JOIN rides rd ON rj.ride_id = rd.id
    JOIN vehicles_details vd ON rd.vehicles_details_id = vd.id
    JOIN vehicle_types vt ON vd.vehicle_type_id = vt.id
    JOIN vehicle_colors vc ON vd.vehicle_color_id = vc.id
  `;

  const joinFields = `
    rj.*,
    JSON_BUILD_OBJECT(
      'id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'email', u.email,
      'profile_picture', up.file_name
    ) AS user_info,
    JSON_BUILD_OBJECT(
      'id', rd.id,
      'pickup_address', rd.pickup_address,
      'drop_off_address', rd.drop_off_address,
      'ride_date', rd.ride_date,
      'tolls', rd.tolls,
      'route_miles', rd.route_miles,
      'max_passengers', rd.max_passengers,
      'price_per_seat', rd.price_per_seat,
      'return_ride_status', rd.return_ride_status,
      'current_passenger_count', rd.current_passenger_count
    ) AS ride_details,
    JSON_BUILD_OBJECT(
      'license_plate_no', vd.license_plate_no,
      'vehicle_brand', vd.vehicle_brand,
      'vehicle_model', vd.vehicle_model,
      'registration_no', vd.registration_no,
      'driving_license_no', vd.driving_license_no,
      'license_expiry_date', vd.license_expiry_date,
      'personal_insurance', vd.personal_insurance,
      'vehicle_type', JSON_BUILD_OBJECT(
        'name', vt.name,
        'id', vt.id
      ),
      'vehicle_color', JSON_BUILD_OBJECT(
        'name', vc.name,
        'code', vc.code,
        'id', vc.id
      )
    ) AS vehicle_info
  `;

  getAll(
    req,
    res,
    "ride_joiners rj", // Table name with alias
    "rj.created_at", // Default sort field
    "rj.*", // Fields from ride_joiners
    { "rj.ride_id": ride_id }, // Filters to get joiners for a specific ride
    join, // JOIN with users, rides, vehicles_details, vehicle_types, vehicle_colors
    joinFields // Fields structured as JSON
  );
};

exports.getAllPublishByUser = async (req, res) => {
  const user_id  = parseInt(req.params.user_id, 10);

  const join = `
    JOIN users u ON r.user_id = u.id AND u.deleted_at IS NULL
    LEFT JOIN uploads up ON u.profile_picture = up.id
    JOIN vehicles_details vd ON r.vehicles_details_id = vd.id
    JOIN vehicle_types vt ON vd.vehicle_type_id = vt.id
    JOIN vehicle_colors vc ON vd.vehicle_color_id = vc.id
  `;

  const joinFields = `
    JSON_BUILD_OBJECT(
      'id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'email', u.email,
      'gender', u.gender,
      'profile_picture', up.file_name
    ) AS user_info,
    JSON_BUILD_OBJECT(
      'license_plate_no', vd.license_plate_no,
      'vehicle_brand', vd.vehicle_brand,
      'vehicle_model', vd.vehicle_model,
      'registration_no', vd.registration_no,
      'driving_license_no', vd.driving_license_no,
      'license_expiry_date', vd.license_expiry_date,
      'personal_insurance', vd.personal_insurance,
      'vehicle_type', JSON_BUILD_OBJECT(
        'name', vt.name,
        'id', vt.id
      ),
      'vehicle_color', JSON_BUILD_OBJECT(
        'name', vc.name,
        'code', vc.code,
        'id', vc.id
      )
    ) AS vehicle_info
  `;

  getAll(
    req,
    res,
    "rides r",
    "r.created_at",
    "r.*",
    { "r.user_id": user_id },
    join,
    joinFields
  );
};

exports.getAllJoinedByUser = async (req, res) => {
  const { user_id } = req.params;

  const join = `
    JOIN users u ON rj.user_id = u.id AND u.deleted_at IS NULL
    LEFT JOIN uploads up ON u.profile_picture = up.id
    JOIN rides rd ON rj.ride_id = rd.id
    JOIN vehicles_details vd ON rd.vehicles_details_id = vd.id
    JOIN vehicle_types vt ON vd.vehicle_type_id = vt.id
    JOIN vehicle_colors vc ON vd.vehicle_color_id = vc.id
  `;

  const joinFields = `
    JSON_BUILD_OBJECT(
      'id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'email', u.email,
      'gender', u.gender,
      'profile_picture', up.file_name
    ) AS user_info,
    JSON_BUILD_OBJECT(
      'id', rd.id,
      'pickup_address', rd.pickup_address,
      'drop_off_address', rd.drop_off_address,
      'ride_date', rd.ride_date,
      'tolls', rd.tolls,
      'route_miles', rd.route_miles,
      'max_passengers', rd.max_passengers,
      'price_per_seat', rd.price_per_seat,
      'return_ride_status', rd.return_ride_status,
      'current_passenger_count', rd.current_passenger_count
    ) AS ride_details,
    JSON_BUILD_OBJECT(
      'license_plate_no', vd.license_plate_no,
      'vehicle_brand', vd.vehicle_brand,
      'vehicle_model', vd.vehicle_model,
      'registration_no', vd.registration_no,
      'driving_license_no', vd.driving_license_no,
      'license_expiry_date', vd.license_expiry_date,
      'personal_insurance', vd.personal_insurance,
      'vehicle_type', JSON_BUILD_OBJECT(
        'name', vt.name,
        'id', vt.id
      ),
      'vehicle_color', JSON_BUILD_OBJECT(
        'name', vc.name,
        'code', vc.code,
        'id', vc.id
      )
    ) AS vehicle_info
  `;

  const additionalFilters = {};
  additionalFilters["rj.status"] = "accepted";
  if (user_id) {
    additionalFilters["rj.user_id"] = user_id;
  }

  getAll(
    req,
    res,
    "ride_joiners rj",
    "rj.created_at",
    "rj.*",
    additionalFilters,
    join,
    joinFields
  );
};


exports.getAllRideByStatus = async (req, res) => {
  const { status } = req.params;
  const user_id = parseInt(req.params.user_id, 10);

  const join = `
    JOIN users u ON r.user_id = u.id AND u.deleted_at IS NULL
    LEFT JOIN uploads up ON u.profile_picture = up.id
    JOIN vehicles_details vd ON r.vehicles_details_id = vd.id
    JOIN vehicle_types vt ON vd.vehicle_type_id = vt.id
    JOIN vehicle_colors vc ON vd.vehicle_color_id = vc.id
  `;

  const joinFields = `
    JSON_BUILD_OBJECT(
      'id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'email', u.email,
      'gender', u.gender,
      'profile_picture', up.file_name
    ) AS user_info,
    JSON_BUILD_OBJECT(
      'license_plate_no', vd.license_plate_no,
      'vehicle_brand', vd.vehicle_brand,
      'vehicle_model', vd.vehicle_model,
      'registration_no', vd.registration_no,
      'driving_license_no', vd.driving_license_no,
      'license_expiry_date', vd.license_expiry_date,
      'personal_insurance', vd.personal_insurance,
      'vehicle_type', JSON_BUILD_OBJECT(
        'name', vt.name,
        'id', vt.id
      ),
      'vehicle_color', JSON_BUILD_OBJECT(
        'name', vc.name,
        'code', vc.code,
        'id', vc.id
      )
    ) AS vehicle_info
  `;

  let additionalFilters = {};
  if (status) {
    additionalFilters["r.ride_status"] = status;
  }
  if (user_id) {
    additionalFilters["r.user_id"] = user_id;
  }

  getAll(
    req,
    res,
    "rides r",
    "r.created_at",
    "r.*",
    additionalFilters,
    join,
    joinFields
  );
};

exports.getAllRequestedRides = async (req, res) => {
  const join = `
    JOIN users u ON rj.user_id = u.id AND u.deleted_at IS NULL
    LEFT JOIN uploads up ON u.profile_picture = up.id
    JOIN rides rd ON rj.ride_id = rd.id
    JOIN vehicles_details vd ON rd.vehicles_details_id = vd.id
    JOIN vehicle_types vt ON vd.vehicle_type_id = vt.id
    JOIN vehicle_colors vc ON vd.vehicle_color_id = vc.id
  `;

  const joinFields = `
    JSON_BUILD_OBJECT(
      'id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'email', u.email,
      'gender', u.gender,
      'profile_picture', up.file_name
    ) AS user_info,
    JSON_BUILD_OBJECT(
      'id', rd.id,
      'pickup_address', rd.pickup_address,
      'drop_off_address', rd.drop_off_address,
      'ride_date', rd.ride_date,
      'tolls', rd.tolls,
      'route_miles', rd.route_miles,
      'max_passengers', rd.max_passengers,
      'price_per_seat', rd.price_per_seat,
      'return_ride_status', rd.return_ride_status,
      'current_passenger_count', rd.current_passenger_count
    ) AS ride_details,
    JSON_BUILD_OBJECT(
      'license_plate_no', vd.license_plate_no,
      'vehicle_brand', vd.vehicle_brand,
      'vehicle_model', vd.vehicle_model,
      'registration_no', vd.registration_no,
      'driving_license_no', vd.driving_license_no,
      'license_expiry_date', vd.license_expiry_date,
      'personal_insurance', vd.personal_insurance,
      'vehicle_type', JSON_BUILD_OBJECT(
        'name', vt.name,
        'id', vt.id
      ),
      'vehicle_color', JSON_BUILD_OBJECT(
        'name', vc.name,
        'code', vc.code,
        'id', vc.id
      )
    ) AS vehicle_info
  `;

  const additionalFilters = {};
  additionalFilters["rj.status"] = "pending";

  getAll(
    req,
    res,
    "ride_joiners rj",
    "rj.created_at",
    "rj.*",
    additionalFilters,
    join,
    joinFields
  );
};
