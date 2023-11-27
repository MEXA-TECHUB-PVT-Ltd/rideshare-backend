const { pool } = require("../config/db.config");
const { responseHandler, updateIntoTable, insertIntoTable } = require("./commonResponse");

// Configuration for fields to exclude from certain tables
const tableFieldExclusions = {
  users: ["password", "otp"], // Add other tables and fields as needed
};
exports.getAll = async (
  req,
  res,
  tableName,
  defaultSortField = "id",
  fields = "*",
  additionalFilters = {}
) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sortField = req.query.sortField || defaultSortField;
  const sortOrder = req.query.sortOrder || "desc";

  try {
    // Adjust fields based on the table and exclusions
    if (fields === "*" && tableFieldExclusions[tableName]) {
      const exclusions = tableFieldExclusions[tableName];
      const allFieldsQuery = `SELECT column_name FROM information_schema.columns WHERE table_name = $1`;
      const allFieldsResult = await pool.query(allFieldsQuery, [tableName]);
      const allFields = allFieldsResult.rows.map((row) => row.column_name);
      fields = allFields
        .filter((field) => !exclusions.includes(field))
        .join(", ");
    }

    let queryParams = [];
    let whereClauses = [];

    // Construct WHERE clause based on additionalFilters
    Object.keys(additionalFilters).forEach((key, index) => {
      whereClauses.push(`${key} = $${index + 1}`);
      queryParams.push(additionalFilters[key]);
    });

    let query = `SELECT ${fields} FROM ${tableName}`;
    let totalQuery = `SELECT COUNT(*) FROM ${tableName}`;

    if (whereClauses.length > 0) {
      const whereClause = ` WHERE ${whereClauses.join(" AND ")}`;
      query += whereClause;
      totalQuery += whereClause; // Apply the same filters to the total count query
    }

    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination logic
    if (page > 0 && limit > 0) {
      queryParams.push(limit);
      queryParams.push((page - 1) * limit);
      query += ` LIMIT $${queryParams.length - 1} OFFSET $${
        queryParams.length
      }`;
    }

    // Execute the total count query with the same parameters as the main query
    const totalResult = await pool.query(
      totalQuery,
      queryParams.slice(0, whereClauses.length)
    );
    const totalRows = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRows / limit);

    const result = await pool.query(query, queryParams);

    if (result.rowCount === 0) {
      return responseHandler(res, 404, false, "No records found");
    }

    const responseData = {
      paginationInfo: {
        totalItems: totalRows,
        totalPages: totalPages,
        currentPage: page,
      },
      response: result.rows,
    };

    return responseHandler(
      res,
      200,
      true,
      `${tableName} records retrieved successfully!`,
      responseData
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};


exports.getSingle = async (
  req,
  res,
  tableName,
  idField = "id",
  fields = "*"
) => {
  const id = req.params.id;

  try {
    const query = `SELECT ${fields} FROM ${tableName} WHERE ${idField} = $1`;
    const result = await pool.query(query, [id]);
    if (tableName === "users") {
      delete result.rows[0].password;
      delete result.rows[0].otp;
    }

    if (result.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        `Record not found in ${tableName}`
      );
    }

    return responseHandler(
      res,
      200,
      true,
      `${tableName} record retrieved successfully!`,
      result.rows[0] // Return the single record
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};
exports.deleteSingle = async (
  req,
  res,
  tableName,
  idField = "id",
  fields = "*"
) => {
  const id = req.params.id;

  try {
    const query = `DELETE FROM ${tableName} WHERE ${idField} = $1 RETURNING *`;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        `Record not found in ${tableName}`,
        result.rows[0]
      );
    }

    if (tableName === "users") {
      delete result.rows[0].password;
      delete result.rows[0].otp;
    }

    return responseHandler(
      res,
      200,
      true,
      `${tableName} record deleted successfully!`,
      result.rows[0] // Return the single record
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};


exports.deleteAll = async (
  req,
  res,
  tableName,
  field = null,
  fieldValue = null
) => {
  try {
    let query;
    let queryParams = [];

    if (field && fieldValue !== null) {
      query = `DELETE FROM ${tableName} WHERE ${field} = $1`;
      queryParams.push(fieldValue);
    } else {
      query = `DELETE FROM ${tableName}`;
    }

    await pool.query(query, queryParams);

    return responseHandler(
      res,
      200,
      true,
      `Records deleted successfully from ${tableName}`
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};


exports.createRecord = async (
  tableName,
  data,
  excludeFields = [],
  checkExistence = null
) => {
  try {
    // Optional: Check if record already exists
    if (checkExistence) {
      const exists = await checkExistence(data);
      if (exists) {
        return { error: true, status: 409, message: "Record already exists" };
      }
    }

    // Insert into table
    const newRecord = await insertIntoTable(tableName, data, excludeFields);

    if (!newRecord) {
      return {
        error: true,
        status: 500,
        message: "Error while creating record",
      };
    }

    return { error: false, status: 201, data: newRecord };
  } catch (error) {
    console.error(error);
    return { error: true, status: 500, message: "Internal Server Error" };
  }
};

exports.updateRecord = async (
  tableName,
  data,
  excludeFields = [],
  condition
) => {
  try {
    // Update the record in the table
    const updatedRecord = await updateIntoTable(
      tableName,
      data,
      excludeFields,
      condition
    );

    if (!updatedRecord) {
      return {
        error: true,
        status: 500,
        message: "Error while updating record",
      };
    }

    return updatedRecord;
  } catch (error) {
    console.error(error);
    return { error: true, status: 500, message: "Internal Server Error" };
  }
};
