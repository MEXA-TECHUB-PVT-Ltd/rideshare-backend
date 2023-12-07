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

exports.create = async (req, res) => {
  const { type, icon, prompt } = req.body;

  // Prepare the data for insertion
  const preferenceData = {
    type,
    icon,
    prompt,
  };

  try {
    const createdResult = await createRecord("preferences", preferenceData, []);

    if (createdResult.error) {
      return responseHandler(
        res,
        createdResult.status,
        false,
        createdResult.message
      );
    }

    const preferenceId = createdResult.data.id;
    const query = `
      SELECT json_build_object(
        'id', preferences.id,
        'type', preferences.type,
        'prompt', preferences.prompt,
        'icon', json_build_object(
          'id', uploads.id,
          'file_name', uploads.file_name,
          'file_type', uploads.file_type,
          'mime_type', uploads.mime_type
        )
      ) as preference_data
      FROM preferences 
      LEFT JOIN uploads ON preferences.icon = uploads.id 
      WHERE preferences.id = $1`;

    const result = await pool.query(query, [preferenceId]);

    if (result.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        "Preference created but not found"
      );
    }

    console.log(result);
    return responseHandler(
      res,
      201,
      true,
      "preferences added successfully!",
      result.rows[0].preference_data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.update = async (req, res) => {
  const { id, type, icon, prompt } = req.body;

  // Prepare the data for updating
  const preferenceData = {
    type,
    icon,
    prompt,
  };

  try {
    const updatedResult = await updateRecord("preferences", preferenceData, [], {
      column: "id",
      value: id,
    });

    if (updatedResult.error) {
      return responseHandler(res, updatedResult.status, false, updatedResult.message);
    }
    const query = `
      SELECT json_build_object(
        'id', preferences.id,
        'type', preferences.type,
        'prompt', preferences.prompt,
        'icon', json_build_object(
          'id', uploads.id,
          'file_name', uploads.file_name,
          'file_type', uploads.file_type,
          'mime_type', uploads.mime_type
        )
      ) as preference_data
      FROM preferences 
      LEFT JOIN uploads ON preferences.icon = uploads.id 
      WHERE preferences.id = $1`;

    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        "Preference created but not found"
      );
    }

    console.log(result);
    return responseHandler(
      res,
      201,
      true,
      "preferences updated successfully!",
      result.rows[0].preference_data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAll = async (req, res) => getAll(req, res, "preferences");
exports.getAllPreferencesByType = async (req, res) => {
  const { type } = req.params; 

  const fields = `
    preferences.*,
    json_build_object(
      'id', uploads.id,
      'file_name', uploads.file_name,
      'file_type', uploads.file_type,
      'mime_type', uploads.mime_type
    ) as icon_details`;

  const join = `
    LEFT JOIN uploads ON preferences.icon = uploads.id`;

  const additionalFilters = { "preferences.type": type };

  return getAll(
    req,
    res,
    "preferences",
    "created_at",
    fields,
    additionalFilters,
    join
  );
};

exports.get = async (req, res) => getSingle(req, res, "preferences");
exports.delete = async (req, res) => deleteSingle(req, res, "preferences");
exports.deleteAll = async (req, res) => deleteAll(req, res, "preferences");
exports.deleteAllPreferenceByType = async (req, res) => {
  const type = req.params.type;
  await deleteAll(req, res, "preferences", { type: type });
};
