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
    user_id,
    license_plate_no,
    vehicle_brand,
    vehicle_model,
    registration_no,
    driving_license_no,
    license_expiry_date,
    personal_insurance,
    vehicle_type_id,
    vehicle_color_id,
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
    vehicle_type_id,
    vehicle_color_id,
  };

  try {
    const vehicle_types = await checkUserExists(
      "vehicle_types",
      "id",
      vehicle_type_id
    );
    if (vehicle_types.rowCount === 0) {
      return responseHandler(res, 404, false, "vehicle_types not found");
    }
    const vehicle_colors = await checkUserExists(
      "vehicle_colors",
      "id",
      vehicle_color_id
    );
    if (vehicle_colors.rowCount === 0) {
      return responseHandler(res, 404, false, "vehicle_colors not found");
    }
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
    return responseHandler(res, 500, false, "Internal Server Error");
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
    vehicle_type_id,
    vehicle_color_id,
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
    vehicle_type_id,
    vehicle_color_id,
  };

  try {
    const vehicle_types = await checkUserExists(
      "vehicle_types",
      "id",
      vehicle_type_id
    );
    if (vehicle_types.rowCount === 0) {
      return responseHandler(res, 404, false, "vehicle_types not found");
    }
    const vehicle_colors = await checkUserExists(
      "vehicle_colors",
      "id",
      vehicle_color_id
    );
    if (vehicle_colors.rowCount === 0) {
      return responseHandler(res, 404, false, "vehicle_colors not found");
    }
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
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAll = async (req, res) => {
  return getAll(
    req,
    res,
    "vehicles_details",
    "id",
    "vehicles_details.*, vehicle_types.name AS vehicle_type_name, vehicle_colors.name AS vehicle_color_name, vehicle_colors.code AS vehicle_color_code",
    {},
    "LEFT JOIN vehicle_types ON vehicles_details.vehicle_type_id = vehicle_types.id LEFT JOIN vehicle_colors ON vehicles_details.vehicle_color_id = vehicle_colors.id"
  );
};

exports.get = async (req, res) => {
  return getSingle(
    req,
    res,
    "vehicles_details",
    "id",
    "vehicles_details.*, vehicle_types.name AS vehicle_type_name, vehicle_colors.name AS vehicle_color_name, vehicle_colors.code AS vehicle_color_code",
    "LEFT JOIN vehicle_types ON vehicles_details.vehicle_type_id = vehicle_types.id LEFT JOIN vehicle_colors ON vehicles_details.vehicle_color_id = vehicle_colors.id"
  );
};

exports.delete = async (req, res) => deleteSingle(req, res, "vehicles_details");
exports.deleteAll = async (req, res) => deleteAll(req, res, "vehicles_details");
