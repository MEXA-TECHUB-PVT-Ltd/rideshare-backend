const { pool } = require("../../config/db.config");
const { responseHandler } = require("../../utils/commonResponse");
const {
  checkPreferenceExists,
  checkUserExists,
} = require("../../utils/dbValidations");

exports.create = async (req, res) => {
  const {
    user_id,
    chattiness_preference_id = [],
    music_preference_id = [],
    pets_preference_id = [],
    smoking_preference_id = [],
  } = req.body;

  // Function to handle inserting or updating preferences
  const handlePreferences = async (
    userId,
    preferenceIds,
    userPrefTable,
    prefType
  ) => {
    const handledPreferences = [];

    if (preferenceIds.length > 0) {
      console.log(preferenceIds);
      // Delete all existing preferences of this type for the user
      const deleteQuery = `DELETE FROM ${userPrefTable} WHERE user_id = $1`;
      try {
        const deleteResult = await pool.query(deleteQuery, [userId]);
        console.log(
          `Deleted ${deleteResult.rowCount} ${prefType} preferences for user ${userId}`
        );
      } catch (error) {
        console.error(
          `Error deleting ${prefType} preferences for user ${userId}:`,
          error
        );
        throw error; // Rethrow to handle in the calling function
      }
    }

    // Check if an empty array is received; if so, delete all preferences of this type
    if (preferenceIds.length === 0) {
      const deleteAllQuery = `DELETE FROM ${userPrefTable} WHERE user_id = $1`;
      await pool.query(deleteAllQuery, [userId]);
      console.log(`Deleted all ${prefType} preferences for user ${userId}`);
    } else {
      // If preferences are provided, first delete existing preferences and then insert new ones
      const deleteQuery = `DELETE FROM ${userPrefTable} WHERE user_id = $1`;
      await pool.query(deleteQuery, [userId]);
      console.log(
        `Deleted existing ${prefType} preferences for user ${userId}`
      );

      for (const preferenceId of preferenceIds) {
        if (!preferenceId) continue;

        // Insert the new preference
        const insertQuery = `
        INSERT INTO ${userPrefTable} (user_id, ${prefType}_preference_id) 
        VALUES ($1, $2) 
        RETURNING *`;
        const insertedPrefResult = await pool.query(insertQuery, [
          userId,
          preferenceId,
        ]);

        // Fetch complete details with JOIN
        const completeDetailsQuery = `
        SELECT up.*, p.type, p.icon, p.prompt 
        FROM ${userPrefTable} up 
        JOIN preferences p ON up.${prefType}_preference_id = p.id 
        WHERE up.id = $1`;
        const completeDetailsResult = await pool.query(completeDetailsQuery, [
          insertedPrefResult.rows[0].id,
        ]);

        handledPreferences.push(completeDetailsResult.rows[0]); // Store handled preference details
      }
    }

    return { data: handledPreferences }; // Return handled preference details
  };

  try {
    // Start transaction
    await pool.query("BEGIN");

    // Handle each type of preference
    const preferenceResults = [];
    preferenceResults.push(
      await handlePreferences(
        user_id,
        chattiness_preference_id,
        "user_chattiness_preferences",
        "chattiness"
      )
    );
    preferenceResults.push(
      await handlePreferences(
        user_id,
        music_preference_id,
        "user_music_preferences",
        "music"
      )
    );
    preferenceResults.push(
      await handlePreferences(
        user_id,
        pets_preference_id,
        "user_pets_preferences",
        "pets"
      )
    );
    preferenceResults.push(
      await handlePreferences(
        user_id,
        smoking_preference_id,
        "user_smoking_preferences",
        "smoking"
      )
    );

    // Check for errors in preferenceResults
    const errors = preferenceResults.filter((result) => result.error);
    if (errors.length > 0) {
      await pool.query("ROLLBACK");
      return responseHandler(
        res,
        400,
        false,
        errors.map((e) => e.error).join(", ")
      );
    }

    // Extract inserted data
    const insertedData = preferenceResults.map((result) => result.data).flat();

    // Commit transaction
    await pool.query("COMMIT");
    return responseHandler(
      res,
      201,
      true,
      "Preferences added successfully",
      insertedData
    );
  } catch (error) {
    // Rollback transaction in case of error
    await pool.query("ROLLBACK");
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.update = async (req, res) => {
  const {
    id,
    user_id,
    chattiness_preference_id,
    music_preference_id,
    pets_preference_id,
    smoking_preference_id,
  } = req.body;

  try {
    const user = await checkUserExists("users", "id", user_id, [
      { column: "deleted_at", value: "IS NULL" },
    ]);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found or deactivated");
    }
    const preferences = await checkUserExists("preferences", "id", id);
    if (preferences.rowCount === 0) {
      return responseHandler(res, 404, false, "preferences not found ");
    }

    await pool.query("BEGIN"); // Start transaction

    // Function to update a single type of preferences
    const updatePreferences = async (
      userId,
      preferenceIds,
      userPrefTable,
      prefType
    ) => {
      const updatedPreferences = [];

      for (const preferenceId of preferenceIds) {
        if (!preferenceId) continue;

        const exists = await checkPreferenceExists(
          "preferences",
          "id",
          preferenceId,
          prefType
        );
        if (!exists) {
          await pool.query("ROLLBACK");
          return {
            error: `Preference ID ${preferenceId} of type '${prefType}' not found`,
          };
        }

        const updateQuery = `
          UPDATE ${userPrefTable}
          SET ${prefType}_preference_id = $2
          WHERE id = $1
          RETURNING *`;
        const updatedPrefResult = await pool.query(updateQuery, [
          id,
          preferenceId,
        ]);

        // Fetching complete details with JOIN
        const completeDetailsQuery = `
      SELECT up.*, p.type, p.icon, p.prompt 
      FROM ${userPrefTable} up 
      JOIN preferences p ON up.${prefType}_preference_id = p.id 
      WHERE up.id = $1`;
        const completeDetailsResult = await pool.query(completeDetailsQuery, [
          updatedPrefResult.rows[0].id,
        ]);

        updatedPreferences.push(completeDetailsResult.rows[0]);
      }
      return { data: updatedPreferences };
    };

    const preferenceUpdateResults = [];
    if (chattiness_preference_id) {
      preferenceUpdateResults.push(
        await updatePreferences(
          user_id,
          chattiness_preference_id,
          "user_chattiness_preferences",
          "chattiness"
        )
      );
    }
    if (music_preference_id) {
      preferenceUpdateResults.push(
        await updatePreferences(
          user_id,
          music_preference_id,
          "user_music_preferences",
          "music"
        )
      );
    }
    if (pets_preference_id) {
      preferenceUpdateResults.push(
        await updatePreferences(
          user_id,
          pets_preference_id,
          "user_pets_preferences",
          "pets"
        )
      );
    }
    if (smoking_preference_id) {
      preferenceUpdateResults.push(
        await updatePreferences(
          user_id,
          smoking_preference_id,
          "user_smoking_preferences",
          "smoking"
        )
      );
    }

    // Check for errors in preferenceUpdateResults
    const errors = preferenceUpdateResults.filter((result) => result.error);
    if (errors.length > 0) {
      await pool.query("ROLLBACK");
      return responseHandler(
        res,
        400,
        false,
        errors.map((e) => e.error).join(", ")
      );
    }

    // Extract updated data
    const updatedData = preferenceUpdateResults
      .map((result) => result.data)
      .flat();

    await pool.query("COMMIT"); // Commit transaction
    return responseHandler(
      res,
      200,
      true,
      "Preferences updated successfully",
      updatedData
    );
  } catch (error) {
    await pool.query("ROLLBACK"); // Rollback transaction in case of error
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

// exports.getAll = async (req, res) => {
//   const {user_id} = req.params
//   const fields = `
//       SELECT up.*, p.type, p.icon, p.prompt
//       FROM  up
//       JOIN preferences p ON up.${prefType}_preference_id = p.id
//       WHERE up.id = $1
// `;

//   const join = ``; // No need for a JOIN clause since all details are fetched via subqueries
//   // let whereClause = " WHERE users.deleted_at IS NULL AND role = 'user'";

//   return getAll(req, res, "users", "created_at", fields,);
// };

exports.getAllUser = async (req, res) => {
  const userId = req.params.user_id;

  try {
    const query = `
SELECT 
  json_build_object(
    'chattiness', (SELECT json_agg(
                    json_build_object(
                      'type', 'chattiness', 
                      'data', row_to_json(p), 
                      'user_preference_id', ucp.id, 
                      'isSelected', CASE WHEN ucp.id IS NOT NULL THEN true ELSE false END
                    )
                  )
                  FROM preferences p
                  LEFT JOIN user_chattiness_preferences ucp ON p.id = ucp.chattiness_preference_id AND ucp.user_id = $1
                  WHERE p.type = 'chattiness'),
    'music', (SELECT json_agg(
                json_build_object(
                  'type', 'music', 
                  'data', row_to_json(p), 
                  'user_preference_id', ump.id, 
                  'isSelected', CASE WHEN ump.id IS NOT NULL THEN true ELSE false END
                )
              )
              FROM preferences p
              LEFT JOIN user_music_preferences ump ON p.id = ump.music_preference_id AND ump.user_id = $1
              WHERE p.type = 'music'),
    'smoking', (SELECT json_agg(
                  json_build_object(
                    'type', 'smoking', 
                    'data', row_to_json(p), 
                    'user_preference_id', usp.id, 
                    'isSelected', CASE WHEN usp.id IS NOT NULL THEN true ELSE false END
                  )
                )
                FROM preferences p
                LEFT JOIN user_smoking_preferences usp ON p.id = usp.smoking_preference_id AND usp.user_id = $1
                WHERE p.type = 'smoking'),
    'pets', (SELECT json_agg(
              json_build_object(
                'type', 'pets', 
                'data', row_to_json(p), 
                'user_preference_id', upp.id, 
                'isSelected', CASE WHEN upp.id IS NOT NULL THEN true ELSE false END
              )
            )
            FROM preferences p
            LEFT JOIN user_pets_preferences upp ON p.id = upp.pets_preference_id AND upp.user_id = $1
            WHERE p.type = 'pets')
  ) AS user_preferences
FROM users
WHERE id = $1;

    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0 || !result.rows[0].user_preferences) {
      return responseHandler(
        res,
        404,
        false,
        "No preferences found for the user"
      );
    }

    return responseHandler(
      res,
      200,
      true,
      "User preferences retrieved successfully",
      result.rows[0].user_preferences
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getUserWithType = async (req, res) => {
  const userId = req.params.user_id;
  const prefType = req.params.pre_type;

  try {
    let query;
    switch (prefType) {
      case "chattiness":
        query = `
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT ucp.*, p.type, p.icon, p.prompt 
            FROM user_chattiness_preferences ucp
            JOIN preferences p ON ucp.chattiness_preference_id = p.id
            WHERE ucp.user_id = $1
          ) t`;
        break;
      case "music":
        query = `
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT ump.*, p.type, p.icon, p.prompt 
            FROM user_music_preferences ump
            JOIN preferences p ON ump.music_preference_id = p.id
            WHERE ump.user_id = $1
          ) t`;
        break;
      case "smoking":
        query = `
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT usp.*, p.type, p.icon, p.prompt 
            FROM user_smoking_preferences usp
            JOIN preferences p ON usp.smoking_preference_id = p.id
            WHERE usp.user_id = $1
          ) t`;
        break;
      case "pets":
        query = `
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT upp.*, p.type, p.icon, p.prompt 
            FROM user_pets_preferences upp
            JOIN preferences p ON upp.pets_preference_id = p.id
            WHERE upp.user_id = $1
          ) t`;
        break;
      default:
        return responseHandler(res, 400, false, "Invalid preference type");
    }

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0 || !result.rows[0].json_agg) {
      return responseHandler(
        res,
        404,
        false,
        "No preferences found for the user with the specified type"
      );
    }

    return responseHandler(
      res,
      200,
      true,
      `User preferences of type ${prefType} retrieved successfully`,
      result.rows[0].json_agg
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getSpecificPreferenceByUser = async (req, res) => {
  const userId = req.params.user_id;
  const prefType = req.params.pre_type;
  const recordId = req.params.pre_id;

  try {
    let query;
    switch (prefType) {
      case "chattiness":
        query = `
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT ucp.id, ucp.chattiness_preference_id, p.type, p.icon, p.prompt, ucp.created_at, ucp.updated_at 
            FROM user_chattiness_preferences ucp
            JOIN preferences p ON ucp.chattiness_preference_id = p.id
            WHERE ucp.user_id = $1 AND ucp.id = $2
          ) t`;
        break;
      case "music":
        query = `
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT ump.id, ump.music_preference_id, p.type, p.icon, p.prompt, ump.created_at, ump.updated_at 
            FROM user_music_preferences ump
            JOIN preferences p ON ump.music_preference_id = p.id
            WHERE ump.user_id = $1 AND ump.id = $2
          ) t`;
        break;
      case "smoking":
        query = `
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT usp.id, usp.smoking_preference_id, p.type, p.icon, p.prompt, usp.created_at, usp.updated_at 
            FROM user_smoking_preferences usp
            JOIN preferences p ON usp.smoking_preference_id = p.id
            WHERE usp.user_id = $1 AND usp.id = $2
          ) t`;
        break;
      case "pets":
        query = `
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT upp.id, upp.pets_preference_id, p.type, p.icon, p.prompt, upp.created_at, upp.updated_at 
            FROM user_pets_preferences upp
            JOIN preferences p ON upp.pets_preference_id = p.id
            WHERE upp.user_id = $1 AND upp.id = $2
          ) t`;
        break;
      default:
        return responseHandler(res, 400, false, "Invalid preference type");
    }

    const result = await pool.query(query, [userId, recordId]);

    if (result.rows.length === 0 || !result.rows[0].json_agg) {
      return responseHandler(
        res,
        404,
        false,
        "No specific preference found for the user with the specified type and record ID"
      );
    }

    return responseHandler(
      res,
      200,
      true,
      `Specific user preference of type ${prefType} retrieved successfully`,
      result.rows[0].json_agg
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};
exports.getAllByUser = async (req, res) => {
  const userId = req.params.user_id;
  const preferenceTypes = ["chattiness", "music", "smoking", "pets"];

  try {
    let allPreferences = {};

    for (const prefType of preferenceTypes) {
      let query;

      switch (prefType) {
        case "chattiness":
          query = `
            SELECT json_agg(row_to_json(t))
            FROM (
              SELECT ucp.id, ucp.chattiness_preference_id, p.type, p.icon, p.prompt, ucp.created_at, ucp.updated_at 
              FROM user_chattiness_preferences ucp
              JOIN preferences p ON ucp.chattiness_preference_id = p.id
              WHERE ucp.user_id = $1
            ) t`;
          break;
        case "music":
          query = `
            SELECT json_agg(row_to_json(t))
            FROM (
              SELECT ump.id, ump.music_preference_id, p.type, p.icon, p.prompt, ump.created_at, ump.updated_at 
              FROM user_music_preferences ump
              JOIN preferences p ON ump.music_preference_id = p.id
              WHERE ump.user_id = $1
            ) t`;
          break;
        case "smoking":
          query = `
            SELECT json_agg(row_to_json(t))
            FROM (
              SELECT usp.id, usp.smoking_preference_id, p.type, p.icon, p.prompt, usp.created_at, usp.updated_at 
              FROM user_smoking_preferences usp
              JOIN preferences p ON usp.smoking_preference_id = p.id
              WHERE usp.user_id = $1
            ) t`;
          break;
        case "pets":
          query = `
            SELECT json_agg(row_to_json(t))
            FROM (
              SELECT upp.id, upp.pets_preference_id, p.type, p.icon, p.prompt, upp.created_at, upp.updated_at 
              FROM user_pets_preferences upp
              JOIN preferences p ON upp.pets_preference_id = p.id
              WHERE upp.user_id = $1
            ) t`;
          break;
        default:
          return responseHandler(res, 400, false, "Invalid preference type");
      }

      const result = await pool.query(query, [userId]);
      allPreferences[prefType] = result.rows[0].json_agg;
    }

    return responseHandler(
      res,
      200,
      true,
      "User preferences retrieved successfully",
      allPreferences
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.deleteUserPreference = async (req, res) => {
  const { userId, recordIds, prefType } = req.body;

  if (
    !userId ||
    !prefType ||
    !Array.isArray(recordIds) ||
    recordIds.length === 0
  ) {
    return responseHandler(
      res,
      400,
      false,
      "userId, prefType, recordIds required"
    );
  }

  try {
    let tableName;
    switch (prefType) {
      case "chattiness":
        tableName = "user_chattiness_preferences";
        break;
      case "music":
        tableName = "user_music_preferences";
        break;
      case "smoking":
        tableName = "user_smoking_preferences";
        break;
      case "pets":
        tableName = "user_pets_preferences";
        break;
      default:
        return responseHandler(res, 400, false, "Invalid preference type");
    }

    const deleteQuery = `
      DELETE FROM ${tableName}
      WHERE id = ANY($1::int[]) AND user_id = $2
      RETURNING *;`;

    const result = await pool.query(deleteQuery, [recordIds, userId]);

    if (result.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        "No preferences found with the specified IDs for the user, or unable to delete"
      );
    }

    return responseHandler(
      res,
      200,
      true,
      `User preferences of type ${prefType} deleted successfully`,
      result.rows
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};
