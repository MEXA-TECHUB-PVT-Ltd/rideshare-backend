const { pool } = require("../../config/db.config");
const { SERVER_URL } = require("../../constants/constants");
const { responseHandler } = require("../../utils/commonResponse");

exports.upload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: "error",
      message: "File is required.",
    });
  }

  const extension = req.file.filename.split(".").pop();

  const mimeType = req.file.mimetype;

  try {
    const result = await pool.query(
      "INSERT INTO uploads (file_name, file_type, mime_type) VALUES ($1, $2, $3) RETURNING *",
      [req.file.filename, extension, mimeType]
    );

    const fileData = result.rows[0];

    const response = {
      id: fileData.id,
      file_name: fileData.file_name,
      file_url: SERVER_URL + "/public/uploads/" + fileData.file_name,
      file_type: fileData.file_type,
      mime_type: fileData.mime_type,
      created_at: fileData.created_at,
      updated_at: fileData.updated_at,
    };

    return responseHandler(
      res,
      201,
      true,
      "File uploaded successfully!",
      response
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getAllCount = async (req, res) => {
  try {
    const usersResult = await pool.query(`SELECT COUNT(*) FROM users`);
    const insuranceUsersResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE insurance_status = 'true'`
    );
    const complaintResult = await pool.query(`SELECT COUNT(*) FROM complaints`);

    const usersCount = usersResult.rows[0].count;
    const insuranceUsersCount = insuranceUsersResult.rows[0].count;
    const complaintCount = complaintResult.rows[0].count;
    const response = {
      usersCount,
      insuranceUsersCount,
      complaintCount,
    };

    return responseHandler(
      res,
      201,
      true,
      "File uploaded successfully!",
      response
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};
