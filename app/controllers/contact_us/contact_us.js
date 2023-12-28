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
  const { email, full_name, message } = req.body;

  // Prepare the data for insertion
  const vehicleData = {
    email,
    full_name,
    message,
  };

  try {
    const result = await createRecord("contact_us", vehicleData, []);

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      201,
      true,
      "contact_us added successfully!",
      result.data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.updateStatus = async (req, res) => {
  const { id, status } = req.body;

  // Prepare the data for updating
  const vehicleData = {
    status,
  };

  try {
    const result = await updateRecord("contact_us", vehicleData, [], {
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
      "contact_us status updated successfully!",
      result
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};
exports.update = async (req, res) => {
  const { id, email, full_name, message } = req.body;

  // Prepare the data for updating
  const vehicleData = {
    email,
    full_name,
    message,
  };

  try {
    const result = await updateRecord("contact_us", vehicleData, [], {
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
      "contact_us details updated successfully!",
      result
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAll = async (req, res) => getAll(req, res, "contact_us");
exports.get = async (req, res) => getSingle(req, res, "contact_us");
exports.delete = async (req, res) => deleteSingle(req, res, "contact_us");
exports.deleteAll = async (req, res) => deleteAll(req, res, "contact_us");
