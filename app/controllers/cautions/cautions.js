const { pool } = require("../../config/db.config");
const { responseHandler } = require("../../utils/commonResponse");
const { createRecord, updateRecord, getAll, getSingle, deleteSingle, deleteAll } = require("../../utils/dbHeplerFunc");

exports.create = async (req, res) => {
  const { name, uploaded_icon_id } = req.body;
  const cautionData = { name, uploaded_icon_id };

  try {
    // Insert the caution record
    const insertResult = await createRecord("cautions", cautionData, []);

    if (insertResult.error) {
      return responseHandler(
        res,
        insertResult.status,
        false,
        insertResult.message
      );
    }

    // Fetch the joined data
    const cautionId = insertResult.data.id;
    const joinedDataResult = await joinQueryFunction(cautionId); 

    if (joinedDataResult.error) {
      return responseHandler(
        res,
        joinedDataResult.status,
        false,
        joinedDataResult.message
      );
    }

    return responseHandler(
      res,
      201,
      true,
      "Caution added successfully!",
      joinedDataResult.data
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
    const cautionId = result.id;
    const joinedDataResult = await joinQueryFunction(cautionId);

    if (joinedDataResult.error) {
      return responseHandler(
        res,
        joinedDataResult.status,
        false,
        joinedDataResult.message
      );
    }

    return responseHandler(
      res,
      201,
      true,
      "Caution added successfully!",
      joinedDataResult.data
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



async function joinQueryFunction(cautionId) {
  const query = `
        SELECT 
            cautions.id, 
            cautions.name, 
            cautions.created_at, 
            cautions.updated_at,
            uploads.file_name,
            uploads.file_type,
            uploads.mime_type
        FROM 
            cautions 
        JOIN 
            uploads ON cautions.uploaded_icon_id = uploads.id
        WHERE 
            cautions.id = $1;
    `;

  try {
    const result = await pool.query(query, [cautionId]);
    return { error: false, data: result.rows[0] };
  } catch (err) {
    console.error("Error executing JOIN query", err);
    return { error: true, message: "Error executing JOIN query" };
  }
}
