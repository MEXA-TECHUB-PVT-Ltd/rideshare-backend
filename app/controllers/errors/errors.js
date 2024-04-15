const { pool } = require("../../config/db.config");

exports.withdrawErrors = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
  error_logs.*,
  json_build_object(
    'email', users.email,
    'first_name', users.first_name,
    'last_name', users.last_name
  ) AS user_info
FROM 
  error_logs 
JOIN 
  users 
ON 
  error_logs.user_id = users.id 
WHERE 
  error_logs.type = 'WITHDRAW_ERROR_LOGS' ORDER BY id DESC
`
    );

    if (result.rowCount === 0) {
      return res
        .status(200)
        .json({ success: true, message: "Records are empty", result: [] });
    }

    return res.status(200).json({
      success: true,
      message: "Records are found",
      result: result.rows,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
