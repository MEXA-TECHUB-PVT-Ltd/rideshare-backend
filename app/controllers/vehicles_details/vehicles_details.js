const { responseHandler } = require("../../utils/commonResponse");
const { createRecord, updateRecord, getAll, getSingle, deleteSingle, deleteAll } = require("../../utils/dbHeplerFunc");

// Assuming you're using Express.js
exports.create = async (req, res) => {
  const {
    user_id,
    license_plate_no,
    vehicle_brand,
    vehicle_model,
    registration_no,
    driving_license_no,
    license_expiry_date,
    personal_insurance,
    vehicle_type,
    vehicle_color,
  } = req.body;

  // Prepare the data for insertion
  const vehicleData = {
    user_id,
    license_plate_no,
    vehicle_brand,
    vehicle_model,
    registration_no,
    driving_license_no,
    license_expiry_date,
    personal_insurance,
    vehicle_type,
    vehicle_color,
  };

  try {
    const result = await createRecord("vehicles_details", vehicleData, []);

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
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.update = async (req, res) => {
  const {
    id,
    license_plate_no,
    vehicle_brand,
    vehicle_model,
    registration_no,
    driving_license_no,
    license_expiry_date,
    personal_insurance,
    vehicle_type,
    vehicle_color,
  } = req.body;

  // Prepare the data for updating
  const vehicleData = {
    license_plate_no,
    vehicle_brand,
    vehicle_model,
    registration_no,
    driving_license_no,
    license_expiry_date,
    personal_insurance,
    vehicle_type,
    vehicle_color,
  };

  try {
    const result = await updateRecord("vehicles_details", vehicleData, [], {
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
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getAll = async (req, res) => getAll(req, res, "vehicles_details");
exports.get = async (req, res) => getSingle(req, res, "vehicles_details");
exports.delete = async (req, res) => deleteSingle(req, res, "vehicles_details");
exports.deleteAll = async (req, res) => deleteAll(req, res, "vehicles_details");
