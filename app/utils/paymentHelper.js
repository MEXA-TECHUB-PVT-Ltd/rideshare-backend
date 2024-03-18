const { createRecord } = require("./dbHeplerFunc");

exports.saveJoinRideDetailsToDB = async (join_ride_details, type) => {
  const data = {
    user_id: join_ride_details.joiner_id,
    ride_id: join_ride_details.ride_id,
    price_offer: join_ride_details.price_offer,
    price_per_seat: join_ride_details.price_per_seat,
    pickup_location: join_ride_details.pickup_location,
    drop_off_location: join_ride_details.drop_off_location,
    total_distance: join_ride_details.total_distance,
    pickup_time: join_ride_details.pickup_time,
    no_seats: join_ride_details.no_seats,
    status: "accepted",
    payment_type: type,
  };
  if (type === "cash") {
    data["payment_status"] = true;
  }
  try {
    return await createRecord("ride_joiners", data, []);
  } catch (error) {
    throw error;
  }
};
