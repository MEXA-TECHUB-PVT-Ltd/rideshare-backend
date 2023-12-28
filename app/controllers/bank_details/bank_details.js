const moment = require("moment");

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
  const { user_id, cardholder_name, card_number, expiry_date, cvv } = req.body;

  // Convert and format the expiry date
  const formattedExpiryDate = moment(expiry_date, "MM/YYYY").format(
    "YYYY-MM-DD"
  );

  // Prepare the data for insertion
  const bankDetailsData = {
    user_id,
    cardholder_name,
    card_number,
    expiry_date: formattedExpiryDate,
    cvv,
  };

  try {
    const userExists = await checkUserExists("users", "id", user_id);
    if (userExists.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }

    const result = await createRecord("bank_details", bankDetailsData, []);

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      201,
      true,
      "bank_details added successfully!",
      result.data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.update = async (req, res) => {
  const { id, user_id, cardholder_name, card_number, expiry_date, cvv } =
    req.body;

  const formattedExpiryDate = moment(expiry_date, "MM/YYYY").format(
    "YYYY-MM-DD"
  );

  // Prepare the data for updating
  const vehicleData = {
    user_id,
    cardholder_name,
    card_number,
    expiry_date: formattedExpiryDate,
    cvv,
  };

  try {
    const userExists = await checkUserExists("users", "id", user_id);
    if (userExists.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }
    const result = await updateRecord("bank_details", vehicleData, [], {
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
      "bank_details details updated successfully!",
      result
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAll = async (req, res) => getAll(req, res, "bank_details");
exports.get = async (req, res) => getSingle(req, res, "bank_details");
exports.delete = async (req, res) => deleteSingle(req, res, "bank_details");
exports.deleteAll = async (req, res) => deleteAll(req, res, "bank_details");
