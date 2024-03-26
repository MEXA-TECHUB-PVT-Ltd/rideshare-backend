const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ejs = require("ejs");
const path = require("path");
// project files directories
const { pool } = require("../../config/db.config");
const {
  checkUserExists,
  checkUserAlreadyExist,
  checkAdmin,
  validatePreferenceId,
} = require("../../utils/dbValidations");
const {
  responseHandler,
  insertIntoTable,
} = require("../../utils/commonResponse");
const {
  getAll,
  updateRecord,
  getSingle,
  deleteSingle,
  deleteAll,
  search,
} = require("../../utils/dbHeplerFunc");
const sendEmail = require("../../lib/sendEmail");
const { JWT_SECRET } = require("../../constants/constants");
const sendOtp = require("../../utils/sendOtp");
const urls = require("../../utils/emailImages");
const {
  renderEJSTemplate,
  verificationEmailTemplatePath,
  signupEmailTemplatePath,
  verificationDataForEjs,
  singupDataForEjs,
  forgetEmailTemplatePath,
} = require("../../utils/renderEmail");

// TODO : Make sure don't get the deactivated users
// TODO : Display the error when deactivated users trying to sign up or logind
// TODO : Need to properly handle the deactivated users --- required time will do it when management want

exports.create = async (req, res) => {
  const { email, password, device_id, type, facebook_access_token, role } =
    req.body;

  try {
    const userAlreadyExists = await checkUserAlreadyExist(email);
    // if (userAlreadyExists) {
    //   return responseHandler(res, 409, false, "User already exists");
    // }

    const defaultRole = role ? role : "user";

    let hashedPassword;
    let userData = {
      email,
      device_id,
      type,
      role: defaultRole,
    };
    const otp = crypto.randomInt(1000, 9999);

    if (type === "email") {
      if (!password) {
        return responseHandler(
          res,
          400,
          false,
          "Password is required for email signup"
        );
      }
      hashedPassword = await bcryptjs.hash(password, 10);
      userData.password = hashedPassword;
    } else if (type === "facebook") {
      if (!facebook_access_token) {
        return responseHandler(
          res,
          400,
          false,
          "Facebook access token is required for Facebook signup"
        );
      }
      userData.facebook_access_token = facebook_access_token;
    } else {
      return responseHandler(res, 400, false, "Invalid signup type");
    }

    userData.otp = otp;

    const newUser = await insertIntoTable("users", userData, ["password"]);

    if (!newUser) {
      return responseHandler(res, 500, false, "Error while creating user");
    }

    try {
      const currentYear = new Date().getFullYear();
      const date = new Date().toLocaleDateString();
      // Use the rendered HTML content for the email
      const verificationData = verificationDataForEjs(email, otp, currentYear);
      const verificationHtmlContent = await renderEJSTemplate(
        verificationEmailTemplatePath,
        verificationData
      );
      const emailSent = await sendEmail(
        email,
        "Action Required: Verify Your Email Address to Activate Your EZPZE Carpool | Rideshare Account",
        verificationHtmlContent
      );

      if (emailSent.success) {
        responseHandler(
          res,
          201,
          true,
          "User created successfully! Please verify your email",
          newUser
        );
      } else {
        console.log("email hasn't been sent successfully");
        // responseHandler(res, 500, false, emailSent.message);
      }
    } catch (sendEmailError) {
      console.error(sendEmailError);
      // responseHandler(res, 500, false, "Error sending verification email");
    }
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.signIn = async (req, res) => {
  const { email, password, type, device_id, role } = req.body;
  const defaultRole = role ? role : "user";
  console.log("BODY", req.body);
  const otp = crypto.randomInt(1000, 9999);
  try {
    const user = await checkUserExists("users", "email", email, [
      { column: "role", value: defaultRole }, // Assuming this function correctly filters users
    ]);

    if (user.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        `${
          role === "admin"
            ? "Admin not found"
            : "User not found or not registered with this type"
        }`
      );
    }

    // Moved inside the conditional blocks to ensure it's only executed as needed
    let updatedResult;

    if (type === "email") {
      const isPasswordValid = await bcryptjs.compare(
        password,
        user.rows[0].password
      );

      if (!isPasswordValid) {
        return responseHandler(res, 401, false, "Invalid credentials");
      }

      // Update OTP after verifying password
      updatedResult = await updateRecord(
        "users",
        { otp }, // What to update
        ["email"], // Where to update
        { column: "email", value: email } // Condition
      );

      console.log(updatedResult);
    } else {
      // Handle third-party authentication, e.g., Google
      // Assuming the email has already been validated by Google and you trust it
      // Here, you might want to update the OTP as well, depending on your logic
    }

    // Assuming the update was successful if we reached this point
    // Continue with sending the OTP via email

    if (defaultRole === "user") {
      const currentYear = new Date().getFullYear();
      const date = new Date().toLocaleDateString();
      const verificationData = verificationDataForEjs(email, otp, currentYear);
      const verificationHtmlContent = await renderEJSTemplate(
        verificationEmailTemplatePath,
        verificationData
      );

      const emailSent = await sendEmail(
        email,
        "Action Required: Verify Your Email Address to Activate Your EZPZE Carpool | Rideshare Account",
        verificationHtmlContent
      );

      if (emailSent.success) {
        responseHandler(
          res,
          201,
          true,
          "We have sent you an email, please verify to sign in"
        );
      } else {
        console.log("Email hasn't been sent successfully");
        // Consider handling this case more gracefully in production
      }
    } else {
      const payload = {
        userId: user.rows[0].id, // Ensure you are referencing the correct property
        email: user.rows[0].email,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
      delete user.rows[0].password;
      return responseHandler(res, 200, true, "Sign-in successfully", {
        token,
        admin: user.rows[0],
      });
    }
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.update = async (req, res) => {
  const {
    id,
    last_name,
    first_name,
    date_of_birth,
    gender,
    profile_uri,
    complementary_address,
    post_address,
    phone,
    about,
    insurance_status,
    location,
    chattiness_preference_ids, // Array of IDs
    music_preference_ids, // Array of IDs
    smoking_preference_ids, // Array of IDs
    pets_preference_ids, // Array of IDs
  } = req.body;

  try {
    const userExists = await checkUserExists("users", "id", id);
    if (userExists.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }

    // Function to validate multiple preference IDs
    const validatePreferenceIds = async (ids, type) => {
      for (const id of ids) {
        if (!(await validatePreferenceId(id, type))) {
          return false;
        }
      }
      return true;
    };

    // Validate each type of preference IDs
    if (
      (chattiness_preference_ids &&
        !(await validatePreferenceIds(
          chattiness_preference_ids,
          "chattiness"
        ))) ||
      (music_preference_ids &&
        !(await validatePreferenceIds(music_preference_ids, "music"))) ||
      (smoking_preference_ids &&
        !(await validatePreferenceIds(smoking_preference_ids, "smoking"))) ||
      (pets_preference_ids &&
        !(await validatePreferenceIds(pets_preference_ids, "pets")))
    ) {
      return responseHandler(res, 400, false, "Invalid preference IDs");
    }

    let userData = {};
    if (last_name !== undefined) userData.last_name = last_name;
    if (first_name !== undefined) userData.first_name = first_name;
    if (date_of_birth !== undefined) {
      userData.date_of_birth = new Date(date_of_birth)
        .toISOString()
        .split("T")[0];
    }
    if (complementary_address !== undefined)
      userData.complementary_address = complementary_address;
    if (post_address !== undefined) userData.post_address = post_address;
    if (phone !== undefined) userData.phone = phone;
    if (about !== undefined) userData.about = about;
    if (gender !== undefined) userData.gender = gender;
    if (chattiness_preference_ids)
      userData.chattiness_preference_ids = chattiness_preference_ids;
    if (music_preference_ids)
      userData.music_preference_ids = music_preference_ids;
    if (smoking_preference_ids)
      userData.smoking_preference_ids = smoking_preference_ids;
    if (pets_preference_ids) userData.pets_preference_ids = pets_preference_ids;
    if (insurance_status !== undefined)
      userData.insurance_status = insurance_status;
    if (location !== undefined) userData.location = location;
    if (profile_uri !== undefined) userData.profile_uri = profile_uri;

    if (Object.keys(userData).length === 0) {
      return responseHandler(res, 400, false, "No update information provided");
    }

    const updateResult = await updateRecord(
      "users",
      userData,
      ["password", "otp", "admin_name"],
      {
        column: "id",
        value: id,
      }
    );

    if (updateResult.error) {
      return responseHandler(
        res,
        500,
        false,
        "Error while retrieving updated user data"
      );
    }

    return responseHandler(
      res,
      200,
      true,
      "User updated successfully!",
      updateResult
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};


exports.verifyDriver = async (req, res) => { 
    const { user_id, is_verified_driver } = req.body;
    try {
      const userExists = await checkUserExists("users", "id", user_id);
      if (userExists.rowCount === 0) {
        return responseHandler(res, 404, false, "User not found");
      }

      const userData = {
        is_verified_driver: is_verified_driver,
      };

      const result = await updateRecord(
        "users",
        userData,
        ["password", "otp", "admin_name"],
        {
          column: "id",
          value: user_id,
        }
      );

      if (result.rowCount === 0) {
        return responseHandler(
          res,
          500,
          false,
          "Error while retrieving updated user data"
        );
      }

      return responseHandler(
        res,
        200,
        true,
        "User status updated successfully!",
        result
      );
    } catch (error) {
      console.error(error);
      return responseHandler(res, 500, false, "Internal Server Error");
    }
}

exports.updateInsuranceStatus = async (req, res) => {
  const { user_id, status } = req.body;
  try {
    const userExists = await checkUserExists("users", "id", user_id);
    if (userExists.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }

    const userData = {
      connected_insurances_user: status,
    };

    const result = await updateRecord(
      "users",
      userData,
      ["password", "otp", "admin_name"],
      {
        column: "id",
        value: user_id,
      }
    );

    if (result.rowCount === 0) {
      return responseHandler(
        res,
        500,
        false,
        "Error while retrieving updated user data"
      );
    }

    return responseHandler(
      res,
      200,
      true,
      "User status updated successfully!",
      result
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.nullifyUserPreference = async (req, res) => {
  const {
    user_id,
    chattiness_preference_id,
    music_preference_id,
    smoking_preference_id,
    pets_preference_id,
  } = req.body;

  try {
    const userExists = await checkUserExists("users", "id", user_id);
    if (userExists.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }

    const user = userExists.rows[0];
    const preferenceType = chattiness_preference_id
      ? "chattiness_preference_id"
      : music_preference_id
      ? "music_preference_id"
      : smoking_preference_id
      ? "smoking_preference_id"
      : "pets_preference_id";

    // Check if the user has the preference set
    if (user[preferenceType] === null) {
      return responseHandler(
        res,
        400,
        false,
        `No ${preferenceType} preference set for user to nullify.`
      );
    }

    const updateQuery = `UPDATE users SET ${preferenceType} = NULL WHERE id = $1 RETURNING *`;
    const result = await pool.query(updateQuery, [user_id]);

    if (result.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        `User not found with id ${user_id}`
      );
    }
    delete result.rows[0].password;
    delete result.rows[0].otp;
    delete result.rows[0].admin_name;

    return responseHandler(
      res,
      200,
      true,
      `User's ${preferenceType} preference nullified successfully!`,
      result.rows[0]
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.forgotPassword = async (req, res) => {
  const { email, role } = req.body;

  const defaultRole = role ? role : "user";
  try {
    const user = await checkUserExists("users", "email", email, [
      { column: "role", value: defaultRole },
    ]);

    if (user.rowCount === 0) {
      return responseHandler(res, 401, false, `Invalid credentials`);
    }

    const user_id = user.rows[0].id;
    const otp = await sendOtp(email, res, user_id);

    try {
      const currentYear = new Date().getFullYear();
      const verificationData = verificationDataForEjs(email, otp, currentYear);
      const verificationHtmlContent = await renderEJSTemplate(
        forgetEmailTemplatePath,
        verificationData
      );
      const emailSent = await sendEmail(
        email,
        "Important: Your Verification Code for Ezepze Carpool | Rideshare",
        verificationHtmlContent
      );

      if (emailSent.success) {
        return responseHandler(
          res,
          200,
          true,
          `We've sent the verification code to ${email}`,
          { otp }
        );
      } else {
        console.log("email hasn't been sent successfully");
        // responseHandler(res, 500, false, emailSent.message);
      }
    } catch (sendEmailError) {
      console.error(sendEmailError);
      // responseHandler(res, 500, false, "Error sending verification email");
    }
  } catch (err) {
    console.log(err);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

// verify code for both email and forgot password
exports.verify_otp = async (req, res) => {
  const { email, otp, role, type } = req.body;
  const defaultRole = role ? role : "user";
  console.log("ROLE", email, otp, defaultRole, type);
  try {
    const user = await checkUserExists("users", "email", email, [
      { column: "role", value: defaultRole },
    ]);

    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }

    const validOtp = await checkUserExists("users", "otp", otp);
    if (validOtp.rowCount === 0) {
      return responseHandler(res, 401, false, "Invalid OTP");
    }

    // Update the user's record to reflect email verification
    const userData = { email_verified: true, otp: null };
    const updatedUser = await updateRecord("users", userData, ["password"], {
      column: "email",
      value: email,
    });

    // If type is 'signup', send the verification email
    if (type === "signup") {
      const currentYear = new Date().getFullYear();
      const date = new Date().toLocaleDateString();
      try {
        const signupData = singupDataForEjs(currentYear);
        const signupHtmlContent = await renderEJSTemplate(
          signupEmailTemplatePath,
          signupData
        );
        const emailSent = await sendEmail(
          email,
          "Welcome to EZPZE Carpool | Rideshare",
          signupHtmlContent
        );

        if (!emailSent.success) {
          console.error(emailSent.message);
          // Consider whether you want to return here or just log the error
          return responseHandler(res, 500, false, emailSent.message);
        }
      } catch (sendEmailError) {
        console.error(sendEmailError);
        return responseHandler(
          res,
          500,
          false,
          "Error sending verification email"
        );
      }
    }

    if (type === "signin") {
      const payload = {
        userId: user.rows[0].id, // Ensure you are referencing the correct property
        email: user.rows[0].email,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
      delete user.rows[0].password;
      updatedUser.token = token;
      return responseHandler(res, 200, true, "Sign-in successfully", {
        user: updatedUser,
      });
    }

    // Send a response back that the OTP was verified successfully
    return responseHandler(
      res,
      200,
      true,
      "OTP verified successfully",
      updatedUser
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.resetPassword = async (req, res) => {
  const { email, new_password, role } = req.body;
  const defaultRole = role ? role : "user";
  try {
    const user = await checkUserExists("users", "email", email, [
      { column: "role", value: defaultRole },
    ]);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }
    const hash = await bcryptjs.hash(new_password, 8);

    // Update data includes only the hashed password
    const userData = { password: hash };

    // Update the user's password based on their email, without excluding any fields
    const updatedUser = await updateRecord("users", userData, [], {
      column: "email",
      value: email,
    });

    if (!updatedUser) {
      return responseHandler(res, 500, false, "Error while updating user");
    }
    delete updatedUser.password;
    return responseHandler(
      res,
      200,
      true,
      "User password reset successfully!",
      updatedUser
    );
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.updatePassword = async (req, res) => {
  const { email, old_password, new_password, role } = req.body;
  console.log(role);
  const defaultRole = role ? role : "user";
  try {
    const user = await checkUserExists("users", "email", email, [
      { column: "role", value: defaultRole },
    ]);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, `${defaultRole} not found`);
    }
    user.rows[0].password;
    if (user.rows[0].password != null) {
      const isMatch = await bcryptjs.compare(
        old_password,
        user.rows[0].password
      );
      if (!isMatch) {
        return res.status(401).json({
          status: false,
          message: "Incorrect password",
        });
      }
    }
    const hash = await bcryptjs.hash(new_password, 10);

    const userData = { email, password: hash };

    const updatedUser = await updateRecord("users", userData, [], {
      column: "email",
      value: email,
    });

    if (!updatedUser) {
      return responseHandler(res, 500, false, "Error while updating user");
    }

    delete updatedUser.password;

    return responseHandler(
      res,
      200,
      true,
      "User password reset successfully!",
      updatedUser
    );
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.getAll = async (req, res) => getAll(req, res, "users");

exports.getAllBlockUsers = async (req, res) =>
  getAll(req, res, "users", "created_at", "*", { block_status: true });


exports.getAllUserByInsuranceStatus = async (req, res) => {
  const { insurance_status } = req.params;

  const filters = {
    insurance_status: insurance_status,
  };

  return getAll(req, res, "users", "created_at", "*", filters, "", "");
};

exports.getAllUsersWithDetails = async (req, res) => {
  const is_verified_driver = req.query.is_verified_driver;
  const fields = `
  users.*,


    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', ucp.chattiness_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_chattiness_preferences ucp
      INNER JOIN preferences p ON ucp.chattiness_preference_id = p.id
      WHERE ucp.user_id = users.id
    ),
    '[]'::json
  ) AS chattiness_preferences,

    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', ump.music_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_music_preferences ump
      INNER JOIN preferences p ON ump.music_preference_id = p.id
      WHERE ump.user_id = users.id
    ),
    '[]'::json
  ) AS music_preferences,

 COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', usp.smoking_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_smoking_preferences usp
      INNER JOIN preferences p ON usp.smoking_preference_id = p.id
      WHERE usp.user_id = users.id
    ),
    '[]'::json
  ) AS smoking_preferences,
   COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', upp.pets_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_pets_preferences upp
      INNER JOIN preferences p ON upp.pets_preference_id = p.id
      WHERE upp.user_id = users.id
    ),
    '[]'::json
  ) AS pets_preferences,
    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', vd.id,
          'user_id', vd.user_id,
          'license_plate_no', vd.license_plate_no,
          'vehicle_brand', vd.vehicle_brand,
          'vehicle_model', vd.vehicle_model,
          'registration_no', vd.registration_no,
          'driving_license_no', vd.driving_license_no,
          'license_expiry_date', vd.license_expiry_date,
          'personal_insurance', vd.personal_insurance
        )
      )
      FROM vehicles_details vd
      WHERE vd.user_id = users.id
    ),
    '[]'::json
  ) AS vehicles_details,


    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', r.id,
          'pickup_location', r.pickup_location,
          'drop_off_location', r.drop_off_location,
          'ride_date', r.ride_date,
          'ride_status', r.ride_status,
          'pickup_address', r.pickup_address,
          'drop_off_address', r.drop_off_address,
          'price_per_seat', r.price_per_seat,
          'time_to_pickup', r.time_to_pickup,
          'current_passenger_count', r.current_passenger_count,
          'caution_details', (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'name', c.name,
                'icon', c.icon
              )
            )
            FROM unnest(r.cautions) AS caution_id
            INNER JOIN cautions c ON c.id = caution_id
          )
        )
      )
      FROM rides r
      WHERE r.user_id = users.id
    ),
    '[]'::json
  ) AS ride_details,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', bd.id,
          'cardholder_name', bd.cardholder_name,
          'card_number', bd.card_number,
          'expiry_date', bd.expiry_date,
          'cvv', bd.cvv
        )
      )
      FROM bank_details bd
      WHERE bd.user_id = users.id
    ),
    '[]'::json
  ) AS bank_details
`;

  const join = ``; // No need for a JOIN clause since all details are fetched via subqueries

  console.log(is_verified_driver);
  let whereClause =
    is_verified_driver === true
      ? `WHERE users.deleted_at IS NULL AND role = 'user' AND is_verified_driver = true`
      : `WHERE users.deleted_at IS NULL AND role = 'user'`;

  return getAll(req, res, "users", "created_at", fields, {}, whereClause);
};

exports.getAllRecentlyDeletedUsersWithDetails = async (req, res) => {
  const fields = `
  users.*,
    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', ucp.chattiness_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_chattiness_preferences ucp
      INNER JOIN preferences p ON ucp.chattiness_preference_id = p.id
      WHERE ucp.user_id = users.id
    ),
    '[]'::json
  ) AS chattiness_preferences,

    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', ump.music_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_music_preferences ump
      INNER JOIN preferences p ON ump.music_preference_id = p.id
      WHERE ump.user_id = users.id
    ),
    '[]'::json
  ) AS music_preferences,

 COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', usp.smoking_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_smoking_preferences usp
      INNER JOIN preferences p ON usp.smoking_preference_id = p.id
      WHERE usp.user_id = users.id
    ),
    '[]'::json
  ) AS smoking_preferences,
   COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', upp.pets_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_pets_preferences upp
      INNER JOIN preferences p ON upp.pets_preference_id = p.id
      WHERE upp.user_id = users.id
    ),
    '[]'::json
  ) AS pets_preferences,
    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', vd.id,
          'user_id', vd.user_id,
          'license_plate_no', vd.license_plate_no,
          'vehicle_brand', vd.vehicle_brand,
          'vehicle_model', vd.vehicle_model,
          'registration_no', vd.registration_no,
          'driving_license_no', vd.driving_license_no,
          'license_expiry_date', vd.license_expiry_date,
          'personal_insurance', vd.personal_insurance
        )
      )
      FROM vehicles_details vd
      WHERE vd.user_id = users.id
    ),
    '[]'::json
  ) AS vehicles_details,


    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', r.id,
          'pickup_location', r.pickup_location,
          'drop_off_location', r.drop_off_location,
          'ride_date', r.ride_date,
          'ride_status', r.ride_status,
          'pickup_address', r.pickup_address,
          'drop_off_address', r.drop_off_address,
          'price_per_seat', r.price_per_seat,
          'time_to_pickup', r.time_to_pickup,
          'current_passenger_count', r.current_passenger_count,
          'caution_details', (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'name', c.name,
                'icon', c.icon
              )
            )
            FROM unnest(r.cautions) AS caution_id
            INNER JOIN cautions c ON c.id = caution_id
          )
        )
      )
      FROM rides r
      WHERE r.user_id = users.id
    ),
    '[]'::json
  ) AS ride_details,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', bd.id,
          'cardholder_name', bd.cardholder_name,
          'card_number', bd.card_number,
          'expiry_date', bd.expiry_date,
          'cvv', bd.cvv
        )
      )
      FROM bank_details bd
      WHERE bd.user_id = users.id
    ),
    '[]'::json
  ) AS bank_details,
  CASE
    WHEN users.deleted_at IS NOT NULL THEN 90 - DATE_PART('day', CURRENT_DATE - users.deleted_at)
    ELSE NULL
  END AS remaining_days_until_complete_deletion
`;

  const additionalFilters = { deleted_at: "IS NOT NULL" };
  let whereClause = " WHERE users.deleted_at IS NOT NULL";

  const join = ``;

  return getAll(req, res, "users", "created_at", fields, {}, whereClause);
};

exports.get = async (req, res) => {
  const tableName = "users";
  const fields = `*`;

  return getSingle(req, res, tableName, "id", fields);
};

exports.getUserWithDetails = async (req, res) => {
  const fields = `
  users.*,


    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', ucp.chattiness_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_chattiness_preferences ucp
      INNER JOIN preferences p ON ucp.chattiness_preference_id = p.id
      WHERE ucp.user_id = users.id
    ),
    '[]'::json
  ) AS chattiness_preferences,

    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', ump.music_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_music_preferences ump
      INNER JOIN preferences p ON ump.music_preference_id = p.id
      WHERE ump.user_id = users.id
    ),
    '[]'::json
  ) AS music_preferences,

 COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', usp.smoking_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_smoking_preferences usp
      INNER JOIN preferences p ON usp.smoking_preference_id = p.id
      WHERE usp.user_id = users.id
    ),
    '[]'::json
  ) AS smoking_preferences,
   COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'preference_id', upp.pets_preference_id,
          'preference_type', p.type,
          'preference_prompt', p.prompt,
          'icon', p.icon
        )
      )
      FROM user_pets_preferences upp
      INNER JOIN preferences p ON upp.pets_preference_id = p.id
      WHERE upp.user_id = users.id
    ),
    '[]'::json
  ) AS pets_preferences,
    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', vd.id,
          'user_id', vd.user_id,
          'license_plate_no', vd.license_plate_no,
          'vehicle_brand', vd.vehicle_brand,
          'vehicle_model', vd.vehicle_model,
          'registration_no', vd.registration_no,
          'driving_license_no', vd.driving_license_no,
          'license_expiry_date', vd.license_expiry_date,
          'personal_insurance', vd.personal_insurance
        )
      )
      FROM vehicles_details vd
      WHERE vd.user_id = users.id
    ),
    '[]'::json
  ) AS vehicles_details,


    COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', r.id,
          'pickup_location', r.pickup_location,
          'drop_off_location', r.drop_off_location,
          'ride_date', r.ride_date,
          'ride_status', r.ride_status,
          'caution_details', (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'name', c.name,
                'icon', c.icon
              )
            )
            FROM unnest(r.cautions) AS caution_id
            INNER JOIN cautions c ON c.id = caution_id
          )
        )
      )
      FROM rides r
      WHERE r.user_id = users.id
    ),
    '[]'::json
  ) AS ride_details,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', bd.id,
          'cardholder_name', bd.cardholder_name,
          'card_number', bd.card_number,
          'expiry_date', bd.expiry_date,
          'cvv', bd.cvv
        )
      )
      FROM bank_details bd
      WHERE bd.user_id = users.id
    ),
    '[]'::json
  ) AS bank_details

  `;

  const join = ``;

  return getSingle(req, res, "users", "id", fields, join);
};

exports.delete = async (req, res) => deleteSingle(req, res, "users");

exports.deleteAll = async (req, res) => {
  // Define the filter for role
  const filters = { role: "user" };

  // Call the generic deleteAll function with the specified filter
  return deleteAll(req, res, "users", filters);
};

exports.search = async (req, res) =>
  search(req, res, "users", ["first_name", "email"], "created_at", "", "", [
    "password",
    "otp",
  ]);

exports.updateBlockStatus = async (req, res) => {
  const { id, block_status } = req.body;
  try {
    const userData = {
      block_status,
      id,
    };

    const updatedUser = await updateRecord("users", userData, [], {
      column: "id",
      value: id,
    });

    if (!updatedUser) {
      return responseHandler(res, 500, false, "Error while updating user");
    }

    delete updatedUser.password;
    delete updatedUser.otp;

    const status = block_status ? "Block" : "UnBlock";
    return responseHandler(
      res,
      200,
      true,
      `User ${status} Successfully!`,
      updatedUser
    );
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.updateDeactivateStatus = async (req, res) => {
  const { id, deactivated } = req.body;
  try {
    const user = await checkUserExists("users", "id", id);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }

    const userData = {
      deactivated,
      deleted_at: deactivated ? "use_current_timestamp" : null,
    };

    const updatedUser = await updateRecord("users", userData, [], {
      column: "id",
      value: id,
    });

    if (!updatedUser) {
      return responseHandler(res, 500, false, "Error while updating user");
    }

    delete updatedUser.password;
    delete updatedUser.otp;

    return responseHandler(
      res,
      200,
      true,
      `User ${deactivated ? "deactivated" : "activated"} Successfully!`,
      updatedUser
    );
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};
exports.getGraphicalRepresent = async (req, res) => {
  try {
    const interval = req.query.interval || "day"; // Default to 'day' if no interval is provided

    let query = "";
    switch (interval) {
      case "day":
        query =
          "SELECT DATE(created_at) as date, COUNT(*) as user_count FROM users GROUP BY DATE(created_at);";
        break;
      case "week":
        query =
          "SELECT DATE_TRUNC('week', created_at) as week, COUNT(*) as user_count FROM users GROUP BY week;";
        break;
      case "month":
        query =
          "SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as user_count FROM users GROUP BY month;";
        break;
      case "year":
        query =
          "SELECT DATE_TRUNC('year', created_at) as year, COUNT(*) as user_count FROM users GROUP BY year;";
        break;
      default:
        return res.status(400).send({ error: "Invalid interval" });
    }

    const { rows } = await pool.query(query);
    const formattedRows = rows.map((row) => {
      // Format the date or week/month/year value to a more readable format
      if (interval === "week") {
        // Example of formatting week interval
        row.week = formatDateRange(row.week);
      }
      return row;
    });

    return responseHandler(
      res,
      200,
      true,
      `Record retrieved successfully!`,
      formattedRows
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

// Example helper function to format the date range for weeks
function formatDateRange(date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(startDate.getDate() + 6);

  return `${startDate.toISOString().split("T")[0]} - ${
    endDate.toISOString().split("T")[0]
  }`;
}
