const { responseHandler } = require("../../utils/commonResponse");
const {
  createRecord,
  getAll,
} = require("../../utils/dbHeplerFunc");

// Assuming you're using Express.js
exports.create = async (req, res) => {
  const { user_id, ride_id, rating, comment } = req.body;

  // Prepare the data for insertion
  const vehicleData = {
    user_id,
    ride_id,
    rating,
    comment,
  };

  try {
    const result = await createRecord("rating", vehicleData, []);

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      201,
      true,
      "rating added successfully!",
      result.data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAllRatingsGivenByUser = async (req, res) => {
  const { user_id } = req.params;

  const additionalFilters = { user_id };

  getAll(req, res, "rating", "created_at", "*", additionalFilters);
};


exports.getAllRatingsOfUser = async (req, res) => {
  const { user_id } = req.params; // Assuming user_id is passed as a URL parameter

  // Set up the parameters for the getAll function
  const tableName = "rating";
  const join = "JOIN rides ON rating.ride_id = rides.id";
  const joinFields = "rides.user_id AS receiver_id";
  const additionalFilters = { "rides.user_id": user_id };
  const defaultSortField = "rating.id"; // Specify 'rating.id' to avoid ambiguity

  // Call the generic getAll function
  getAll(
    req,
    res,
    tableName,
    defaultSortField,
    "*",
    additionalFilters,
    join,
    joinFields
  );
};

