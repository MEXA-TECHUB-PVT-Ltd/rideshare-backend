const { responseHandler } = require("../../utils/commonResponse");
const { createRecord, getAll } = require("../../utils/dbHeplerFunc");

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

  const fields = `
    r.*,
    json_build_object(
      'id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'email', u.email,
      'profile_uri', u.profile_uri
    ) as user_details`;

  // JOIN clause to get user details
  const join = `
    LEFT JOIN users u ON r.user_id = u.id`;

  getAll(
    req,
    res,
    "rating r", // Alias 'rating' as 'r'
    "r.created_at", // Default sort field
    fields,
    additionalFilters, // Filters by ride_id
    join
  );
};

exports.getAllRatingsByRide = async (req, res) => {
  const { ride_id } = req.params;

  // Fields to select in the query
  const fields = `
    r.*,
    json_build_object(
      'id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'email', u.email,
      'profile_uri', u.profile_uri
    ) as user_details`;

  // JOIN clause to get user details
  const join = `
    LEFT JOIN users u ON r.user_id = u.id`;

  // Filters to apply
  const additionalFilters = { "r.ride_id": ride_id };

  // Call the generic getAll function with the specified parameters
  getAll(
    req,
    res,
    "rating r", // Alias 'rating' as 'r'
    "r.created_at", // Default sort field
    fields,
    additionalFilters, // Filters by ride_id
    join
  );
};

exports.getAllRatingsOfUser = async (req, res) => {
  const { user_id } = req.params; // Assuming user_id is passed as a URL parameter

  // Fields to select in the query
  const fields = `
    r.*,
    json_build_object(
      'id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'email', u.email,
      'profile_uri', u.profile_uri
    ) as user_details`;

  // JOIN clause to get user details
  const join = `
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN rides ON r.ride_id = rides.id`;

  let additionalFilters = {};
  if (user_id) {
    additionalFilters["rides.user_id"] = user_id;
  }

  // Call the generic getAll function
  return getAll(
    req,
    res,
    "rating r", // Alias 'rating' as 'r'
    "r.created_at", // Default sort field
    fields,
    additionalFilters, // No additional filters
    join
  );
};
