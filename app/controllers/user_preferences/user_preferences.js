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
