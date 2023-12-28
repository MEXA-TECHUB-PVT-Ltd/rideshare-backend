const { responseHandler } = require("../../utils/commonResponse");
const {
  createRecord,
  updateRecord,
  getAll,
  getSingle,
  deleteSingle,
  deleteAll,
} = require("../../utils/dbHeplerFunc");


exports.create = async (req, res) => {
  const {
    rate
  } = req.body;

  // Prepare the data for insertion
  const vehicleData = {
    rate
  };

  try {
    const result = await createRecord("passenger_rates", vehicleData, []);

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      201,
      true,
      "passenger_rates added successfully!",
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
    rate,
  } = req.body;

  // Prepare the data for updating
  const vehicleData = {
    rate
  };

  try {
    const result = await updateRecord("passenger_rates", vehicleData, [], {
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
      "passenger_rates details updated successfully!",
      result
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAll = async (req, res) => getAll(req, res, "passenger_rates");
exports.get = async (req, res) => getSingle(req, res, "passenger_rates");
exports.delete = async (req, res) => deleteSingle(req, res, "passenger_rates");
exports.deleteAll = async (req, res) => deleteAll(req, res, "passenger_rates");
