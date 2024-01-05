const { pool } = require("../../config/db.config");
const {
  preferencesSchema,
  updatePreferencesSchema,
  validateFile,
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
    // Validate the request body using Joi
    await preferencesSchema.validateAsync(req.body);

    // Additional file validation
    validateFile(req.file);

    // Extract the necessary fields from the validated data
    const { type, prompt } = req.body;
    const iconPath = req.file.path;

    // Prepare the data for insertion
    const preferenceData = {
      type,
      icon: iconPath,
      prompt,
    };

    // Insert the data into the database (assuming createRecord handles this)
    const createdResult = await createRecord("preferences", preferenceData, []);

    if (createdResult.error) {
      return responseHandler(
        res,
        createdResult.status,
        false,
        createdResult.message
      );
    }
    return responseHandler(
      res,
      201,
      true,
      "preferences added successfully!",
      createdResult.data
    );
  } catch (error) {
    if (error.isJoi) {
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
    // Handle other types of errors (like file validation errors, database errors, etc.)
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.update = async (req, res) => {
  try {
    // Validate the request body using Joi
    await updatePreferencesSchema.validateAsync(req.body);

    // Additional file validation
    validateFile(req.file);

    const { id, type, prompt } = req.body;
    const path = req.file.path;

    // Prepare the data for updating
    const preferenceData = {
      type,
      icon: path,
      prompt,
    };

    const updatedResult = await updateRecord(
      "preferences",
      preferenceData,
      [],
      {
        column: "id",
        value: id,
      }
    );

    if (updatedResult.error) {
      return responseHandler(
        res,
        updatedResult.status,
        false,
        updatedResult.message
      );
    }
    return responseHandler(
      res,
      201,
      true,
      "preferences updated successfully!",
      updatedResult
    );
  } catch (error) {
    if (error.isJoi) {
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
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAll = async (req, res) => {
  return getAll(req, res, "preferences", "created_at", "*", {});
};
exports.getAllPreferencesByType = async (req, res) => {
  const { type } = req.params;



  const additionalFilters = { "preferences.type": type };

  return getAll(
    req,
    res,
    "preferences",
    "created_at",
    "*",
    additionalFilters,
  );
};

exports.get = async (req, res) => getSingle(req, res, "preferences");
exports.delete = async (req, res) => deleteSingle(req, res, "preferences");
exports.deleteAll = async (req, res) => deleteAll(req, res, "preferences");
exports.deleteAllPreferenceByType = async (req, res) => {
  const type = req.params.type;
  await deleteAll(req, res, "preferences", { type: type });
};
