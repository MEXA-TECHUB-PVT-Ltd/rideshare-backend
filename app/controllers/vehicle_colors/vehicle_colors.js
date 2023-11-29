const { responseHandler } = require("../../utils/commonResponse");
const {
  createRecord,
  updateRecord,
  getAll,
  getSingle,
  deleteSingle,
  deleteAll,
  search,
} = require("../../utils/dbHeplerFunc");

// Assuming you're using Express.js
exports.create = async (req, res) => {
  const { name, code } = req.body;

  // Prepare the data for insertion
  const vehicleData = {
    name,
    code,
  };

  try {
    const result = await createRecord("vehicle_colors", vehicleData, []);

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      201,
      true,
      "vehicle_colors added successfully!",
      result.data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.update = async (req, res) => {
  const { id, name, code } = req.body;

  // Prepare the data for updating
  const vehicleData = {
    name,
    code,
  };

  try {
    const result = await updateRecord("vehicle_colors", vehicleData, [], {
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
      "vehicle_colors details updated successfully!",
      result
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAll = async (req, res) => getAll(req, res, "vehicle_colors");
exports.get = async (req, res) => getSingle(req, res, "vehicle_colors");
exports.delete = async (req, res) => deleteSingle(req, res, "vehicle_colors");
exports.deleteAll = async (req, res) => deleteAll(req, res, "vehicle_colors");
exports.search = async (req, res) => search(req, res, "vehicle_colors", ["name"]);
