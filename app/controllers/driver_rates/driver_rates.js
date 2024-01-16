const { pool } = require("../../config/db.config");
const { responseHandler } = require("../../utils/commonResponse");
const {
  createRecord,
  updateRecord,
  getAll,
  getSingle,
  deleteSingle,
  deleteAll,
} = require("../../utils/dbHeplerFunc");

// Assuming you're using Express.js
exports.create = async (req, res) => {
  const { start_range, end_range, rate_per_mile } = req.body;

  // Prepare the data for insertion
  const vehicleData = {
    start_range,
    end_range,
    rate_per_mile,
  };

  try {
    const existingRates = await pool.query(
      "SELECT * FROM driver_rates WHERE NOT (end_range <= $1 OR start_range >= $2)",
      [start_range, end_range]
    );

    // Check if there are existing overlapping rates
    if (existingRates.rows && existingRates.rows.length > 0) {
      return responseHandler(
        res,
        400,
        false,
        "Rate range conflicts with existing rates"
      );
    }
    const result = await createRecord("driver_rates", vehicleData, []);

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      201,
      true,
      "driver_rates added successfully!",
      result.data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.update = async (req, res) => {
  const { id, start_range, end_range, rate_per_mile } = req.body;

  // Prepare the data for updating
  const vehicleData = {
    start_range,
    end_range,
    rate_per_mile,
  };

  try {
    const result = await updateRecord("driver_rates", vehicleData, [], {
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
      "driver_rates details updated successfully!",
      result
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAll = async (req, res) => getAll(req, res, "driver_rates");
exports.get = async (req, res) => getSingle(req, res, "driver_rates");
exports.delete = async (req, res) => deleteSingle(req, res, "driver_rates");
exports.deleteAll = async (req, res) => deleteAll(req, res, "driver_rates");
