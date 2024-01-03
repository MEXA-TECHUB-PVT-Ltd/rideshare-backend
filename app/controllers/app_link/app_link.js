const { pool } = require("../../config/db.config");
const { responseHandler } = require("../../utils/commonResponse");
const { createRecord, getAll, getSingle } = require("../../utils/dbHeplerFunc");

// Assuming you're using Express.js
exports.create = async (req, res) => {
  const { url } = req.body;

  try {
    // Check if there is any record in the app_link table
    const existingRecords = await pool.query("SELECT * FROM app_link");

    let result;
    if (existingRecords.rowCount > 0) {
      // If there's a record, update it
      result = await pool.query(
        "UPDATE app_link SET url = $1 WHERE id = $2 RETURNING *",
        [url, existingRecords.rows[0].id]
      );
    } else {
      // If there's no record, create a new one
      result = await pool.query(
        "INSERT INTO app_link (url) VALUES ($1) RETURNING *",
        [url]
      );
    }

    if (result.rowCount === 0) {
      return responseHandler(res, 400, false, "Error while processing link");
    }
    return responseHandler(
      res,
      result.rowCount > 0 && existingRecords.rowCount > 0 ? 200 : 201,
      true,
      "Link processed successfully!",
      result.rows[0]
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};


exports.getAll = async (req, res) => getAll(req, res, "app_link");
exports.get = async (req, res) => getSingle(req, res, "app_link");
exports.delete = async (req, res) => deleteSingle(req, res, "app_link");
exports.deleteAll = async (req, res) => deleteAll(req, res, "app_link");
