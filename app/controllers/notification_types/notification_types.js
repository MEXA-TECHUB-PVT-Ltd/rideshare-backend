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
    const result = await createRecord("notification_types", vehicleData, []);

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      201,
      true,
      "notification_types added successfully!",
      result.data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.update = async (req, res) => {
  const { id, name } = req.body;

  // Prepare the data for updating
  const vehicleData = {
    name,
  };

  try {
    const result = await updateRecord("notification_types", vehicleData, [], {
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
      "notification_types details updated successfully!",
      result
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAll = async (req, res) => getAll(req, res, "notification_types");
exports.get = async (req, res) => getSingle(req, res, "notification_types");
exports.delete = async (req, res) => deleteSingle(req, res, "notification_types");
exports.deleteAll = async (req, res) => deleteAll(req, res, "notification_types");
