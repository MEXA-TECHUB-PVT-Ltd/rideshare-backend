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
const { checkUserExists } = require("../../utils/dbValidations");

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
    insurance_image,
  } = req.body;

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
    insurance_image,
  };

  try {
    const vehicleTypeExists = await checkUserExists(
      "vehicle_types",
      "id",
      vehicle_type_id
    );
    if (vehicleTypeExists.rowCount === 0) {
      return responseHandler(res, 404, false, "Vehicle type not found");
    }
    const userExists = await checkUserExists("users", "id", user_id, [
      { column: "deleted_at", value: "IS NULL" },
    ]);

    if (userExists.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found or deactivated");
    }

    const vehicleColorExists = await checkUserExists(
      "vehicle_colors",
      "id",
      vehicle_color_id
    );
    if (vehicleColorExists.rowCount === 0) {
      return responseHandler(res, 404, false, "Vehicle color not found");
    }

    const insertResult = await createRecord(
      "vehicles_details",
      vehicleData,
      []
    );

    if (insertResult.error) {
      return responseHandler(
        res,
        insertResult.status,
        false,
        insertResult.message
      );
    }

    const vehicleId = insertResult.data.id; 

    const fullVehicleDetails = await pool.query(
      `
      SELECT vd.*, vt.name AS vehicle_type, vc.name AS vehicle_color, vc.code AS color_code
      FROM vehicles_details vd
      LEFT JOIN vehicle_types vt ON vd.vehicle_type_id = vt.id
      LEFT JOIN vehicle_colors vc ON vd.vehicle_color_id = vc.id
      WHERE vd.id = $1`,
      [vehicleId]
    );

    if (fullVehicleDetails.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        "Vehicle details not found after insertion"
      );
    }

    return responseHandler(
      res,
      201,
      true,
      "Vehicle details added successfully!",
      fullVehicleDetails.rows[0]
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

  // Initialize an empty object for vehicleData
  let vehicleData = {};

  // Add fields to vehicleData only if they are provided
  if (license_plate_no !== undefined)
    vehicleData.license_plate_no = license_plate_no;
  if (vehicle_brand !== undefined) vehicleData.vehicle_brand = vehicle_brand;
  if (vehicle_model !== undefined) vehicleData.vehicle_model = vehicle_model;
  if (registration_no !== undefined)
    vehicleData.registration_no = registration_no;
  if (driving_license_no !== undefined)
    vehicleData.driving_license_no = driving_license_no;
  if (license_expiry_date !== undefined)
    vehicleData.license_expiry_date = license_expiry_date;
  if (personal_insurance !== undefined)
    vehicleData.personal_insurance = personal_insurance;
  if (vehicle_type_id !== undefined)
    vehicleData.vehicle_type_id = vehicle_type_id;
  if (vehicle_color_id !== undefined)
    vehicleData.vehicle_color_id = vehicle_color_id;

  try {
    // Check if vehicleData is empty
    if (Object.keys(vehicleData).length === 0) {
      return responseHandler(res, 400, false, "No update information provided");
    }

    // Check if vehicle type and color exists if they are provided for update
    if (vehicleData.vehicle_type_id) {
      const vehicleTypeExists = await checkUserExists(
        "vehicle_types",
        "id",
        vehicle_type_id
      );
      if (vehicleTypeExists.rowCount === 0) {
        return responseHandler(res, 404, false, "Vehicle type not found");
      }
    }
    if (vehicleData.vehicle_color_id) {
      const vehicleColorExists = await checkUserExists(
        "vehicle_colors",
        "id",
        vehicle_color_id
      );
      if (vehicleColorExists.rowCount === 0) {
        return responseHandler(res, 404, false, "Vehicle color not found");
      }
    }

    const updateResult = await updateRecord(
      "vehicles_details",
      vehicleData,
      [],
      { column: "id", value: id }
    );

    if (updateResult.error) {
      return responseHandler(
        res,
        updateResult.status,
        false,
        updateResult.message
      );
    }

    // Fetch the updated vehicle details along with type and color
    const fullVehicleDetails = await pool.query(
      `
      SELECT vd.*, vt.name AS vehicle_type, vc.name AS vehicle_color, vc.code AS color_code
      FROM vehicles_details vd
      LEFT JOIN vehicle_types vt ON vd.vehicle_type_id = vt.id
      LEFT JOIN vehicle_colors vc ON vd.vehicle_color_id = vc.id
      WHERE vd.id = $1`,
      [id]
    );

    if (fullVehicleDetails.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        "Updated vehicle details not found"
      );
    }

    return responseHandler(
      res,
      200,
      true,
      "Vehicle details updated successfully!",
      fullVehicleDetails.rows[0]
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
    "LEFT JOIN vehicle_types ON vehicles_details.vehicle_type_id = vehicle_types.id LEFT JOIN vehicle_colors ON vehicles_details.vehicle_color_id = vehicle_colors.id INNER JOIN users u ON vehicles_details.user_id = u.id AND u.deleted_at IS NULL"
  );
};


exports.getAllByUser = async (req, res) => {
  const { user_id } = req.params; // Assuming the user ID is passed as a URL parameter

  // Define the fields to be selected, including those from joined tables
  const fields =
    "vehicles_details.*, vehicle_types.name AS vehicle_type_name, vehicle_colors.name AS vehicle_color_name, vehicle_colors.code AS vehicle_color_code";
  const join =
    "LEFT JOIN vehicle_types ON vehicles_details.vehicle_type_id = vehicle_types.id LEFT JOIN vehicle_colors ON vehicles_details.vehicle_color_id = vehicle_colors.id INNER JOIN users u ON vehicles_details.user_id = u.id AND u.deleted_at IS NULL" ;

  // Set additional filter for user ID
  const additionalFilters = { "vehicles_details.user_id": user_id };

  return getAll(
    req,
    res,
    "vehicles_details",
    "created_at",
    fields,
    additionalFilters,
    join
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
