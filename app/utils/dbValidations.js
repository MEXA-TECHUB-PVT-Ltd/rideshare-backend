const { pool } = require("../config/db.config");

exports.checkUserAlreadyExist = async (email) => {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return result.rowCount > 0;
};

exports.checkUserExists = async (
  table,
  column,
  field,
  additionalConditions = []
) => {
  let query = `SELECT * FROM ${table} WHERE ${column} = $1`;
  const values = [field];

  additionalConditions.forEach((condition, index) => {
    if (condition.value === "IS NULL") {
      query += ` AND ${condition.column} IS NULL`;
    } else if (condition.value === "IS NOT NULL") {
      query += ` AND ${condition.column} IS NOT NULL`;
    } else {
      query += ` AND ${condition.column} = $${index + 2}`; // Starting index is 2 since $1 is already used
      values.push(condition.value);
    }
  });

  const result = await pool.query(query, values);
  return result;
};



exports.checkAdmin = async (table, column, field) => {
    const result = await pool.query(
      `SELECT * FROM ${table} WHERE ${column} = $1 AND role = 'admin'`,
      [field] 
    );
    return result;
}

exports.validatePreferenceId = async (preferenceId, preferenceType) => {
  const result = await pool.query(
    `SELECT * FROM preferences WHERE id = $1 AND type = $2`,
    [preferenceId, preferenceType]
  );
  return result.rowCount > 0;
}


exports.checkPreferenceExists = async (table, column, value, type) => {
  const query = `SELECT * FROM ${table} WHERE ${column} = $1 AND type = $2`;
  const result = await pool.query(query, [value, type]);
  return result.rowCount > 0;
};
