const { pool } = require("../config/db.config");

exports.checkUserAlreadyExist = async (email) => {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return result.rowCount > 0;
};

exports.checkUserExists = async (table, column, field) => {
    const result = await pool.query(
      `SELECT * FROM ${table} WHERE ${column} = $1`,
      [field]
    );
    return result;
}
