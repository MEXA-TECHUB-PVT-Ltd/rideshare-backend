const { pool } = require("../../config/db.config");
const { responseHandler } = require("../../utils/commonResponse");
const {
  checkPreferenceExists,
  checkUserExists,
} = require("../../utils/dbValidations");

exports.create = async (req, res) => {
  const {
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

    await pool.query("BEGIN"); // Start transaction

    // Function to insert a single type of preferences
    const insertPreferences = async (
      userId,
      preferenceIds,
      userPrefTable,
      prefType
    ) => {
      const insertedPreferences = [];

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

        const insertQuery = `
      INSERT INTO ${userPrefTable} (user_id, ${prefType}_preference_id) 
      VALUES ($1, $2) 
      RETURNING *`;
        const insertedPrefResult = await pool.query(insertQuery, [
          userId,
          preferenceId,
        ]);

        // Fetching complete details with JOIN
        const completeDetailsQuery = `
      SELECT up.*, p.type, p.icon, p.prompt 
      FROM ${userPrefTable} up 
      JOIN preferences p ON up.${prefType}_preference_id = p.id 
      WHERE up.id = $1`;
        const completeDetailsResult = await pool.query(completeDetailsQuery, [
          insertedPrefResult.rows[0].id,
        ]);

        insertedPreferences.push(completeDetailsResult.rows[0]); // Store inserted preference details with additional info
      }
      return { data: insertedPreferences }; // Return inserted preference details with additional info
    };

    const preferenceResults = [];
    if (chattiness_preference_id) {
      preferenceResults.push(
        await insertPreferences(
          user_id,
          chattiness_preference_id,
          "user_chattiness_preferences",
          "chattiness"
        )
      );
    }
    if (music_preference_id) {
      preferenceResults.push(
        await insertPreferences(
          user_id,
          music_preference_id,
          "user_music_preferences",
          "music"
        )
      );
    }
    if (pets_preference_id) {
      preferenceResults.push(
        await insertPreferences(
          user_id,
          pets_preference_id,
          "user_pets_preferences",
          "pets"
        )
      );
    }
    if (smoking_preference_id) {
      preferenceResults.push(
        await insertPreferences(
          user_id,
          smoking_preference_id,
          "user_smoking_preferences",
          "smoking"
        )
      );
    }

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

    await pool.query("COMMIT"); // Commit transaction
    return responseHandler(
      res,
      201,
      true,
      "Preferences added successfully",
      insertedData
    );
  } catch (error) {
    await pool.query("ROLLBACK"); // Rollback transaction in case of error
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
  const userId = req.params.user_id; // Ensure you have a route parameter for userId

  try {
    const query = `
      SELECT 
        json_build_object(
          'chattiness', (SELECT json_agg(row_to_json(t)) FROM (SELECT id, chattiness_preference_id, created_at, updated_at FROM user_chattiness_preferences WHERE user_id = $1) t),
          'music', (SELECT json_agg(row_to_json(t)) FROM (SELECT id, music_preference_id, created_at, updated_at FROM user_music_preferences WHERE user_id = $1) t),
          'smoking', (SELECT json_agg(row_to_json(t)) FROM (SELECT id, smoking_preference_id, created_at, updated_at FROM user_smoking_preferences WHERE user_id = $1) t),
          'pets', (SELECT json_agg(row_to_json(t)) FROM (SELECT id, pets_preference_id, created_at, updated_at FROM user_pets_preferences WHERE user_id = $1) t)
        ) AS user_preferences
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
  const userId = req.params.user_id;
  const prefType = req.params.pre_type;
  const recordId = req.params.pre_id;

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
      WHERE id = $1 AND user_id = $2
      RETURNING *;`;

    const result = await pool.query(deleteQuery, [recordId, userId]);

    if (result.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        "No preference found with the specified ID for the user, or unable to delete"
      );
    }

    return responseHandler(
      res,
      200,
      true,
      `User preference of type ${prefType} deleted successfully`,
      result.rows[0]
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};
