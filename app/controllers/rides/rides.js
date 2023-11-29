// external libraries
const geolib = require("geolib");

// project files
const { responseHandler } = require("../../utils/commonResponse");
const { createRecord } = require("../../utils/dbHeplerFunc");
const { checkUserExists } = require("../../utils/dbValidations");
const { pool } = require("../../config/db.config");

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
    const { leave_location, going_location } = req.query;

    // Parse the leave_location and going_location values
    const [leave_location_latitude, leave_location_longitude] = leave_location
      .split(",")
      .map(parseFloat);
    const [going_location_latitude, going_location_longitude] = going_location
      .split(",")
      .map(parseFloat);

    // Perform validation and sanitize inputs as needed.

    const proximityRadius = 50; // Define the maximum radius in miles

    // Fetch all rides from the database (you may want to limit the query based on date_of_ride, seats, and price_offer)

    const allRidesQuery = `
      SELECT * FROM rides;
    `;

    const allRidesResult = await pool.query(allRidesQuery);
    const allRides = allRidesResult.rows;

    // Calculate the distance between each ride's pickup/drop-off location and the leave and going locations
    const nearbyRides = allRides.filter((ride) => {
      const ridePickupLat = parseFloat(ride.pickup_location.x);
      const ridePickupLong = parseFloat(ride.pickup_location.y);
      const rideDropOffLat = parseFloat(ride.drop_off_location.x);
      const rideDropOffLong = parseFloat(ride.drop_off_location.y);

      const leaveLocationDistance = calculateDistance(
        leave_location_latitude,
        leave_location_longitude,
        ridePickupLat,
        ridePickupLong
      );

      const goingLocationDistance = calculateDistance(
        going_location_latitude,
        going_location_longitude,
        rideDropOffLat,
        rideDropOffLong
      );

      // Check if either pickup or drop-off location is within proximity
      return (
        leaveLocationDistance <= proximityRadius ||
        goingLocationDistance <= proximityRadius
      );
    });

    res.json(nearbyRides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Function to calculate the distance between two sets of latitude and longitude coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 0.621371; // Convert distance to miles
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
