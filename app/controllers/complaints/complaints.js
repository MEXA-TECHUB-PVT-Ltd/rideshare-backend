const { responseHandler } = require("../../utils/commonResponse");
const {
  createRecord,
  updateRecord,
  getAll,
  getSingle,
  deleteSingle,
  deleteAll,
  getUserDetails,
} = require("../../utils/dbHeplerFunc");
const { checkUserExists } = require("../../utils/dbValidations");

exports.create = async (req, res) => {
  const { user_id, rider_id, reason } = req.body;

  try {
    const user = await getUserDetails(user_id);
    const rider = await getUserDetails(rider_id);

    if (!user) {
      return responseHandler(res, 404, false, "User not found");
    }
    if (!rider) {
      return responseHandler(res, 404, false, "Rider not found");
    }

    const complaintDetails = { user_id, rider_id, reason };
    const result = await createRecord("complaints", complaintDetails, []);

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }

    return responseHandler(res, 201, true, "Complaint added successfully!", {
      complaint: result.data,
      user: user,
      rider: rider,
    });
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.update = async (req, res) => {
  const { id, user_id, rider_id, reason } = req.body;

  // Prepare the data for updating
  const complaintDetails = {
    user_id,
    rider_id,
    reason,
  };

  try {
    const user = await getUserDetails(user_id);
    const rider = await getUserDetails(rider_id);
    if (!user) {
      return responseHandler(res, 404, false, "User not found");
    }
    if (!rider) {
      return responseHandler(res, 404, false, "Rider not found");
    }
    const result = await updateRecord("complaints", complaintDetails, [], {
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
      "complaints details updated successfully!",
      {
        complaint: result.data,
        user: user,
        rider: rider,
      }
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};


exports.getAll = async (req, res) => {
  const fields = `
    complaints.*,
    json_build_object(
      'id', u1.id,
      'profile_picture', json_build_object(
        'id', up1.id,
        'file_name', up1.file_name
      )
    ) as user_details,
    json_build_object(
      'id', u2.id,
      'profile_picture', json_build_object(
        'id', up2.id,
        'file_name', up2.file_name
      )
    ) as rider_details`;

  const join = `
    LEFT JOIN users u1 ON complaints.user_id = u1.id
    LEFT JOIN uploads up1 ON u1.profile_picture = up1.id
    LEFT JOIN users u2 ON complaints.rider_id = u2.id
    LEFT JOIN uploads up2 ON u2.profile_picture = up2.id`;

  return getAll(
    req,
    res,
    "complaints",
    "created_at",
    fields,
    {}, // No additional filters
    join
  );
};

exports.getAllComplaintsByUser = async (req, res) => {
  const { user_id } = req.params; 

  const fields = `
    complaints.*,
    json_build_object(
      'id', u1.id,
      'profile_picture', json_build_object(
        'id', up1.id,
        'file_name', up1.file_name
      )
    ) as user_details,
    json_build_object(
      'id', u2.id,
      'profile_picture', json_build_object(
        'id', up2.id,
        'file_name', up2.file_name
      )
    ) as rider_details`;

  const join = `
    LEFT JOIN users u1 ON complaints.user_id = u1.id
    LEFT JOIN uploads up1 ON u1.profile_picture = up1.id
    LEFT JOIN users u2 ON complaints.rider_id = u2.id
    LEFT JOIN uploads up2 ON u2.profile_picture = up2.id`;
  
  const additionalFilters = { "complaints.user_id": user_id };

  return getAll(
    req,
    res,
    "complaints",
    "created_at",
    fields,
    additionalFilters,
    join
  );
};

exports.get = async (req, res) => getSingle(req, res, "complaints");
exports.delete = async (req, res) => deleteSingle(req, res, "complaints");
exports.deleteAll = async (req, res) => deleteAll(req, res, "complaints");
// Example: Delete all complaints made by a specific user
exports.deleteAllComplaintsByUser = async (req, res) => {
  const user_id = req.params.user_id; 
  await deleteAll(req, res, "complaints", { user_id: user_id });
};
