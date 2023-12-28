const { responseHandler } = require("../../utils/commonResponse");
const {
  createRecord,
  updateRecord,
  getAll,
  getSingle,
  deleteSingle,
  deleteAll,
} = require("../../utils/dbHeplerFunc");
const { checkUserExists } = require("../../utils/dbValidations");

// Assuming you're using Express.js
exports.create = async (req, res) => {
  const {
    email,
    pickup_location: { latitude: pickupLat, longitude: pickupLong },
    drop_off_location: { latitude: dropOffLat, longitude: dropOffLong },
    drop_off_address,
    pickup_address,
  } = req.body;

  try {
    const pickupPoint = `(${pickupLat}, ${pickupLong})`;
    const dropOffPoint = `(${dropOffLat}, ${dropOffLong})`;
    const user = await checkUserExists("users", "email", email);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }

    const user_id = user.rows[0].id;
    // Prepare the data for insertion
    const notificationData = {
      user_id,
      pickup_location: pickupPoint,
      drop_off_location: dropOffPoint,
      drop_off_address,
      pickup_address,
    };
    const result = await createRecord(
      "search_ride_notifications",
      notificationData,
      []
    );

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      201,
      true,
      "search_ride_notifications added successfully!",
      result.data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.update = async (req, res) => {
  const {
    id,
    email,
    pickup_location: { latitude: pickupLat, longitude: pickupLong },
    drop_off_location: { latitude: dropOffLat, longitude: dropOffLong },
    drop_off_address,
    pickup_address,
  } = req.body;

  try {
    const pickupPoint = `(${pickupLat}, ${pickupLong})`;
    const dropOffPoint = `(${dropOffLat}, ${dropOffLong})`;
    const user = await checkUserExists("users", "email", email);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }

    const user_id = user.rows[0].id;
    // Prepare the data for insertion
    const notificationData = {
      user_id,
      pickup_location: pickupPoint,
      drop_off_location: dropOffPoint,
      drop_off_address,
      pickup_address,
    };
    const result = await updateRecord(
      "search_ride_notifications",
      notificationData,
      [],
      {
        column: "id",
        value: id,
      }
    );

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      200,
      true,
      "search_ride_notifications details updated successfully!",
      result
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAll = async (req, res) =>
  getAll(req, res, "search_ride_notifications");
exports.get = async (req, res) =>
  getSingle(req, res, "search_ride_notifications");
exports.delete = async (req, res) =>
  deleteSingle(req, res, "search_ride_notifications");
exports.deleteAll = async (req, res) =>
  deleteAll(req, res, "search_ride_notifications");
