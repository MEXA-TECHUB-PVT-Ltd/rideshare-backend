// external libraries
const geolib = require("geolib");

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
  };

  try {
    const user = await checkUserExists("users", "id", user_id);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }
    notifyUsersForNewRide(rideData);

    const result = await createRecord("rides", rideData, []);

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }

    return responseHandler(
      res,
      201,
      true,
      "Ride details added successfully!",
      result.data
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
    const allRidesQuery = `SELECT 
  rides.*, 
  vehicle_types.name AS vehicle_type_name
FROM 
  rides
JOIN 
  vehicles_details ON rides.user_id = vehicles_details.user_id
JOIN 
  vehicle_types ON vehicles_details.vehicle_type_id = vehicle_types.id;

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

exports.get = async (req, res) => getSingle(req, res, "rides");

exports.joinRides = async (req, res) => {
  const { user_id, ride_id } = req.body;

  try {
    const user = await checkUserExists("users", "id", user_id);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
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
  const { ride_id } = req.params;

  getAll(
    req,
    res,
    "ride_joiners rj", // Table name with alias
    "rj.created_at", // Default sort field
    "rj.*", // Fields from ride_joiners
    { "rj.ride_id": ride_id }, // Filters to get joiners for a specific ride
    "JOIN users u ON rj.user_id = u.id", // Join with users table
    "u.id, u.first_name, u.last_name, u.email, u.profile_picture" // User fields to include
  );
};

exports.getRideJoiners = async (req, res) => {
  const { ride_id } = req.params;

  getAll(
    req,
    res,
    "ride_joiners rj",
    "rj.created_at",
    "rj.*",
    { "rj.ride_id": ride_id },
    `JOIN users u ON rj.user_id = u.id
     LEFT JOIN uploads up ON u.profile_picture = up.id`,
    "u.id, u.first_name, u.last_name, u.email, u.gender, up.file_name AS profile_picture"
  );
};

exports.getAllPublishByUser = async (req, res) => {
  const { user_id } = req.params;

  getAll(
    req,
    res,
    "rides r",
    "r.created_at",
    "r.*",
    { "r.user_id": user_id },
    `JOIN users u ON r.user_id = u.id
     LEFT JOIN uploads up ON u.profile_picture = up.id`,
    "u.id, u.first_name, u.last_name, u.email, u.gender, up.file_name AS profile_picture"
  );
};
exports.getAllJoinedByUser = async (req, res) => {
  const { user_id } = req.params;

  getAll(
    req,
    res,
    "ride_joiners rj",
    "rj.created_at",
    "rj.*, json_build_object('id', rd.id, 'pickup_address', rd.pickup_address, 'drop_off_address', rd.drop_off_address, 'ride_date', rd.ride_date, 'ride_tolls', rd.tolls, 'route_miles', rd.route_miles, 'max_passengers', rd.max_passengers, 'price_per_seat', rd.price_per_seat, 'return_ride_status', rd.return_ride_status, 'current_passenger_count', rd.current_passenger_count) as ride_details",
    { "rj.user_id": user_id },
    `JOIN users u ON rj.user_id = u.id
   LEFT JOIN uploads up ON u.profile_picture = up.id
   JOIN rides rd ON rj.ride_id = rd.id`, // Additional join to the rides table
    "u.id, u.first_name, u.last_name, u.email, u.gender, up.file_name AS profile_picture"
  );
};

exports.startRide = async (req, res) => {
  const { ride_id, ride_status } = req.body;

  try {
    const rides = await checkUserExists("rides", "id", ride_id);
    if (rides.rowCount === 0) {
      return responseHandler(res, 404, false, "Rides not found");
    }
    const userData = {
      ride_status: ride_status,
    };

    const updatedRide = await updateRecord("rides", userData, [], {
      column: "id",
      value: ride_id,
    });

    const io = getIo();
    io.emit("rideStarted", ride_id);

    return responseHandler(
      res,
      201,
      true,
      "Ride details added successfully!",
      updatedRide.data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};


exports.pickupLocation = async (req, res) => {
  
}
