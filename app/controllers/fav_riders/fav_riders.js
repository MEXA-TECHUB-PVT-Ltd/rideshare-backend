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

// Assuming you're using Express.js
exports.create = async (req, res) => {
  const { user_id, rider_id } = req.body;

  // Check for missing required fields
  if (!user_id || !rider_id) {
    return responseHandler(
      res,
      400,
      false,
      "Missing required fields: user_id and rider_id"
    );
  }

  // Prepare the data for insertion
  const favRiderData = {
    user_id,
    rider_id,
  };

  try {
    const user = await checkUserExists("users", "id", user_id, [
      { column: "deleted_at", value: "IS NULL" },
    ]);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found or deactivated");
    }
    const rider = await checkUserExists("users", "id", rider_id, [
      { column: "deleted_at", value: "IS NULL" },
    ]);
    if (rider.rowCount === 0) {
      return responseHandler(res, 404, false, "Rider not found or deactivated");
    }
    const riderAlreadyExists = await checkRiderAlreadyExists(rider_id, user_id);
    if (riderAlreadyExists) {
      return responseHandler(res, 404, false, "Rider already in favorites");
    }
    const insertResult = await createRecord("fav_riders", favRiderData);

    if (insertResult.error) {
      return responseHandler(
        res,
        insertResult.status,
        false,
        insertResult.message
      );
    }

    let updateRes = insertResult.data;
    const favId = insertResult.data.id;

    // Fetch the newly created record along with user and rider details
    const fetchQuery = `
SELECT
  fr.id, fr.user_id, fr.rider_id,
  u.first_name AS user_first_name, 
  u.last_name AS user_last_name, 
  u.email AS user_email, 
  u.gender AS user_gender, 
  u.profile_uri AS user_profile_picture,
  r.first_name AS rider_first_name, 
  r.last_name AS rider_last_name, 
  r.email AS rider_email, 
  r.gender AS rider_gender, 
  r.profile_uri AS rider_profile_picture
FROM fav_riders fr
JOIN users u ON fr.user_id = u.id
JOIN users r ON fr.rider_id = r.id
WHERE fr.id = $1;
    `;
    const joinData = await pool.query(fetchQuery, [favId]);
    updateRes = joinData.rows[0];
    return responseHandler(
      res,
      201,
      true,
      "Favorite rider added successfully!",
      updateRes
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAllFavoriteRiders = async (req, res) => {
  const { user_id } = req.params;
  const additionalFilters = { "fr.user_id": user_id };

  // Specify the JOIN clause to fetch details from the users table
  const join = `JOIN users u ON fr.rider_id = u.id AND deleted_at IS NULL`;
  const joinFields = `u.first_name AS rider_first_name, u.last_name AS rider_last_name, u.email AS rider_email, u.gender AS rider_gender, u.profile_uri AS rider_profile_picture`;

  // Call the getAll function
  getAll(
    req,
    res,
    "fav_riders fr", // Table name with alias
    "fr.id", // Default sort field
    "fr.*", // Fields from fav_riders
    additionalFilters,
    join,
    joinFields
  );
};

exports.getAll = async (req, res) => {
  const join = `JOIN users u ON fr.rider_id = u.id AND deleted_at IS NULL`;
  const joinFields = `u.first_name AS rider_first_name, u.last_name AS rider_last_name, u.email AS rider_email, u.gender AS rider_gender, u.profile_uri AS rider_profile_picture`;
  return getAll(
    req,
    res,
    "fav_riders fr",
    "fr.id",
    "fr.*",
    {},
    join,
    joinFields
  );
};
exports.get = async (req, res) => {
  const join = `
    JOIN users u ON fav_riders.user_id = u.id AND deleted_at IS NULL
  `;

  const joinFields = `
    u.first_name AS rider_first_name, u.last_name AS rider_last_name, u.email AS rider_email, u.gender AS rider_gender, u.profile_uri AS rider_profile_picture
  `;
  return getSingle(
    req,
    res,
    "fav_riders",
    "id",
    "fav_riders.*",
    join,
    joinFields
  );
};
exports.delete = async (req, res) => deleteSingle(req, res, "fav_riders");
exports.deleteAll = async (req, res) => deleteAll(req, res, "fav_riders");

async function checkRiderAlreadyExists(rider_id, user_id) {
  const result = await pool.query(
    `SELECT * FROM fav_riders WHERE rider_id = $1 AND user_id = $2`,
    [rider_id, user_id]
  );
  return result.rowCount > 0;
}
