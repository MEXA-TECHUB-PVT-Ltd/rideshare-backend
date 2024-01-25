const { pool } = require("../config/db.config");

exports.responseHandler = (res, status, success, message, result = null) => {
  const response = {
    status: success,
    message: message,
  };

  if (result) response.result = result;

  return res.status(status).json(response);
};

exports.insertIntoTable = async (tableName, data, excludeFields = []) => {
  const keys = Object.keys(data);
  const values = Object.values(data);

  // Constructing query placeholders
  const numberizedPlaceholders = keys
    .map((_, index) => `$${index + 1}`)
    .join(", ");

  const query = `
        INSERT INTO ${tableName} (${keys.join(", ")})
        VALUES (${numberizedPlaceholders})
        RETURNING *;
    `;

  try {
    const result = await pool.query(query, values);
    const rowData = result.rows[0];

    // Exclude specified fields
    excludeFields.forEach((field) => {
      delete rowData[field];
    });

    return rowData;
  } catch (error) {
    console.error("Error in insertIntoTable:", error);
    throw error;
  }
};


exports.updateIntoTable = async (
  tableName,
  data,
  excludeFields = [],
  condition
) => {
  // Exclude fields from the update data
  excludeFields.forEach((field) => {
    delete data[field];
  });

  const keys = Object.keys(data);
  let values = [];
  let valueIndex = 1;

  // Constructing query set clause
  const setClause = keys
    .map((key) => {
      if (data[key] === "use_current_timestamp") {
        // Handle CURRENT_TIMESTAMP separately
        return `${key} = CURRENT_TIMESTAMP`;
      } else {
        values.push(data[key]);
        return `${key} = $${valueIndex++}`;
      }
    })
    .join(", ");

  // Adding one to the placeholders for the condition value
  const conditionPlaceholder = `$${valueIndex}`;

  const query = `
    UPDATE ${tableName}
    SET ${setClause}
    WHERE ${condition.column} = ${conditionPlaceholder}
    RETURNING *;
  `;

  try {
    // Adding the condition value to the values array
    values.push(condition.value);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return null; // No record was updated
    }
    const rowData = result.rows[0];

    // Exclude specified fields from the result
    excludeFields.forEach((field) => {
      delete rowData[field];
    });

    return rowData;
  } catch (error) {
    console.error("Error in updateIntoTable:", error);
    throw error;
  }
};
