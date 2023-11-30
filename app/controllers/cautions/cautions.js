const { responseHandler } = require("../../utils/commonResponse");
const { createRecord, updateRecord, getAll, getSingle, deleteSingle, deleteAll } = require("../../utils/dbHeplerFunc");

exports.create = async (req, res) => {
  const { name, uploaded_icon_id } = req.body;

  // Prepare the data for insertion
  const cautionData = {
    name,
    uploaded_icon_id,
  };

  try {
    const result = await createRecord("cautions", cautionData, []);

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }
    return responseHandler(
      res,
      201,
      true,
      "Caution added successfully!",
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
    name, 
    uploaded_icon_id,
  } = req.body;

  // Prepare the data for updating
  const cautionData = {
    id,
    name,
    uploaded_icon_id,
  };

  try {
    const result = await updateRecord("cautions", cautionData, [], {
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
  getAll(
    req,
    res,
    "cautions",
    "id", 
    "cautions.id, cautions.name, cautions.created_at, cautions.updated_at",
    {}, 
    "LEFT JOIN uploads ON cautions.uploaded_icon_id = uploads.id", 
    "uploads.file_name AS icon_file_name, uploads.mime_type AS icon_mime_type" 
  );
};

exports.get = async (req, res) => {
  return getSingle(
    req,
    res,
    "cautions",
    "id",
    "cautions.id, cautions.name, cautions.created_at, cautions.updated_at",
    "LEFT JOIN uploads ON cautions.uploaded_icon_id = uploads.id",
    "uploads.file_name AS icon_file_name, uploads.mime_type AS icon_mime_type"
  );
};
exports.delete = async (req, res) => deleteSingle(req, res, "cautions");
exports.deleteAll = async (req, res) => deleteAll(req, res, "cautions");
