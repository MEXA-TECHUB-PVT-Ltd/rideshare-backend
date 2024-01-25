const { pool } = require("../../config/db.config");
const {
  validateFile,
  createCautionSchema,
  updateCautionSchema,
} = require("../../lib/validation.dto");
const { responseHandler } = require("../../utils/commonResponse");
const {
  createRecord,
  updateRecord,
  getAll,
  getSingle,
  deleteSingle,
  deleteAll,
} = require("../../utils/dbHeplerFunc");

exports.create = async (req, res) => {
  try {
    await createCautionSchema.validateAsync(req.body);
    validateFile(req.file);

    const { name } = req.body;
    const icon = req.file.path;
    const cautionData = { name, icon };

    const insertResult = await createRecord("cautions", cautionData, []);

    if (insertResult.error) {
      return responseHandler(
        res,
        insertResult.status,
        false,
        insertResult.message
      );
    }

    return responseHandler(
      res,
      201,
      true,
      "Caution added successfully!",
      insertResult.data
    );
  } catch (error) {
    if (error.isJoi) {
      // Joi validation error handling
      const validationMessages = error.details
        .map((detail) => detail.message)
        .join(", ");
      return res
        .status(400)
        .send({ success: false, message: validationMessages });
    }

    if (error.message === "FileError") {
      return responseHandler(res, 400, false, "File is required");
    }

    console.error("Common Error", error);

    return responseHandler(res, 500, false, "Internal Server Error");
  }
};


exports.update = async (req, res) => {
  try {
    await updateCautionSchema.validateAsync(req.body);
    validateFile(req.file); // Ensure this doesn't throw an error when the file isn't provided

    const { id, name } = req.body;
    const icon = req.file.path;

    const cautionData = { id, name, icon };

    const result = await updateRecord("cautions", cautionData, [], {
      column: "id",
      value: id,
    });

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }

    return responseHandler(
      res,
      200, // Status code changed to 200 for successful update
      true,
      "Caution updated successfully!",
      result
    );
  } catch (error) {
    if (error.isJoi) {
      const validationMessages = error.details
        .map((detail) => detail.message)
        .join(", ");
      return responseHandler(res, 400, false, validationMessages);
    }

    if (error.message === "FileError") {
      return responseHandler(res, 400, false, "File is required");
    }

    console.error("Update Error:", error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};


exports.getAll = async (req, res) => {
  getAll(
    req,
    res,
    "cautions",
    "id",
    "*",
    {},
  );
};

exports.get = async (req, res) => {
  return getSingle(
    req,
    res,
    "cautions",
    "id",
    "*",
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
