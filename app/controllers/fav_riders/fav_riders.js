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
    const user = await checkUserExists("users", "id", user_id);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }
    const rider = await checkUserExists("users", "id", rider_id);
    if (rider.rowCount === 0) {
      return responseHandler(res, 404, false, "Rider not found");
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
  uu.file_name AS user_profile_picture,
  r.first_name AS rider_first_name, 
  r.last_name AS rider_last_name, 
  r.email AS rider_email, 
  r.gender AS rider_gender, 
  ru.file_name AS rider_profile_picture
FROM fav_riders fr
JOIN users u ON fr.user_id = u.id
LEFT JOIN uploads uu ON u.profile_picture = uu.id
JOIN users r ON fr.rider_id = r.id
LEFT JOIN uploads ru ON r.profile_picture = ru.id
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
  const join = `JOIN users u ON fr.rider_id = u.id LEFT JOIN uploads up ON u.profile_picture = up.id`;
  const joinFields = `u.first_name AS rider_first_name, u.last_name AS rider_last_name, u.email AS rider_email, u.gender AS rider_gender, up.file_name AS rider_profile_picture`;

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

exports.getAll = async (req, res) => getAll(req, res, "fav_riders");
exports.get = async (req, res) => getSingle(req, res, "fav_riders");
exports.delete = async (req, res) => deleteSingle(req, res, "fav_riders");
exports.deleteAll = async (req, res) => deleteAll(req, res, "fav_riders");
