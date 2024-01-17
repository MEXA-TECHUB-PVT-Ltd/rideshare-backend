const { pool } = require("../config/db.config");
const {
  responseHandler,
  updateIntoTable,
  insertIntoTable,
} = require("./commonResponse");
const { checkUserExists } = require("./dbValidations");

// Configuration for fields to exclude from certain tables
const tableFieldExclusions = {
  users: ["password", "otp"], // Add other tables and fields as needed
};

exports.getAll = async (
  req,
  res,
  tableName,
  defaultSortField = "created_at",
  fields = "*",
  additionalFilters = {},
  join = "",
  joinFields = ""
) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const sortField = req.query.sortField || defaultSortField;
  const sortOrder = req.query.sortOrder || "DESC";

  try {
    // Adjust fields based on the table, exclusions, and JOINs
    let selectFields = fields;
    if (join && joinFields) {
      selectFields += `, ${joinFields}`;
    }

    if (fields === "*" && tableFieldExclusions[tableName]) {
      const exclusions = tableFieldExclusions[tableName];
      const allFieldsQuery = `SELECT column_name FROM information_schema.columns WHERE table_name = $1`;
      const allFieldsResult = await pool.query(allFieldsQuery, [tableName]);
      const allFields = allFieldsResult.rows.map((row) => row.column_name);
      selectFields = allFields
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

    let query = `SELECT ${selectFields} FROM ${tableName} ${join}`;
    let totalQuery = `SELECT COUNT(*) FROM ${tableName} ${join}`;

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
    // console.log(query, queryParams, "\n", "result", result.rowCount);

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
  fields = "*",
  join = "",
  joinFields = ""
) => {
  const id = parseInt(req.params.id, 10);
  // console.log(typeof id);

  try {
    const user = await checkUserExists(tableName, "id", id);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "Record not found");
    }
    // Constructing the SELECT part of the query
    let selectFields = fields;
    if (join && joinFields) {
      selectFields += `, ${joinFields}`;
    }

    // Constructing the full query
    const query = `SELECT ${selectFields} FROM ${tableName} ${join} WHERE ${tableName}.${idField} = $1`;

    const result = await pool.query(query, [id]);

    // Remove sensitive data for 'users' table
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

exports.deleteAll = async (req, res, tableName, filters = {}) => {
  try {
    // Construct WHERE clause based on filters
    let whereClauses = [];
    let queryParams = [];
    Object.keys(filters).forEach((key, index) => {
      whereClauses.push(`${key} = $${index + 1}`);
      queryParams.push(filters[key]);
    });

    // Check if records exist
    let checkQuery = `SELECT COUNT(*) FROM ${tableName}`;
    if (whereClauses.length > 0) {
      checkQuery += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    const checkResult = await pool.query(checkQuery, queryParams);
    const count = parseInt(checkResult.rows[0].count, 10);

    if (count === 0) {
      return responseHandler(
        res,
        404,
        false,
        `No records found to delete in ${tableName}`
      );
    }

    // Delete records
    let deleteQuery = `DELETE FROM ${tableName}`;
    if (whereClauses.length > 0) {
      deleteQuery += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    await pool.query(deleteQuery, queryParams);

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
        message:
          "Error while updating record, ensure you have passed the correct credentials",
      };
    }

    return updatedRecord;
  } catch (error) {
    console.error(error);
    return { error: true, status: 500, message: "Internal Server Error" };
  }
};
exports.search = async (
  req,
  res,
  tableName,
  searchFields,
  defaultSortField = "id",
  join = "",
  joinFields = "",
  excludeFields = []
) => {
  const searchTerm = req.query.query || "";
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sortField = req.query.sortField || defaultSortField;
  const sortOrder = req.query.sortOrder || "desc";
  const offset = (page - 1) * limit;
  const searchQuery = `%${searchTerm}%`; // Partial match

  try {
    // Construct the WHERE clause for searching
    const searchConditions = searchFields
      .map((field, index) => `${field} ILIKE $${index + 1}`)
      .join(" OR ");

    // Constructing SELECT fields
    let selectFields = `${tableName}.*`;
    if (tableName === "users") {
      // If the table is 'users', exclude specified fields
      selectFields = (
        await pool.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
          [tableName]
        )
      ).rows
        .map((row) => row.column_name)
        .filter((column) => !excludeFields.includes(column))
        .map((column) => `${tableName}.${column}`)
        .join(", ");
    }
    if (join && joinFields) {
      selectFields += `, ${joinFields}`;
    }

    // Main search query
    let sqlQuery = `
      SELECT ${selectFields} FROM ${tableName} ${join}
      WHERE ${searchConditions}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${searchFields.length + 1} OFFSET $${searchFields.length + 2};
    `;

    // Query for total count
    let countQuery = `
      SELECT COUNT(*) FROM ${tableName} ${join}
      WHERE ${searchConditions};
    `;

    // Execute the search query
    const result = await pool.query(sqlQuery, [
      ...searchFields.map(() => searchQuery),
      limit,
      offset,
    ]);

    // Execute the count query
    const countResult = await pool.query(
      countQuery,
      searchFields.map(() => searchQuery)
    );
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    return responseHandler(res, 200, true, "Search results", {
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      results: result.rows,
    });
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getUserDetails = async (userId) => {
  const query = `
    SELECT * FROM users WHERE id = $1`;

  const result = await pool.query(query, [userId]);
  console.log(result.rows[0]);
  return result.rows[0] ? result.rows[0] : null;
};
