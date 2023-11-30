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
  const { name } = req.body;

  // Prepare the data for insertion
  const vehicleData = {
    name,
  };

  try {
    const result = await createRecord("vehicle_types", vehicleData, []);

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      201,
      true,
      "Vehicle details added successfully!",
      result.data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.update = async (req, res) => {
  const { id, name } = req.body;

  const vehicleData = {
    name,
  };

  try {
    const result = await updateRecord("vehicle_types", vehicleData, [], {
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
      "Vehicle details updated successfully!",
      result
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAll = async (req, res) => getAll(req, res, "vehicle_types");
exports.get = async (req, res) => getSingle(req, res, "vehicle_types");
exports.delete = async (req, res) => deleteSingle(req, res, "vehicle_types");
exports.deleteAll = async (req, res) => deleteAll(req, res, "vehicle_types");
