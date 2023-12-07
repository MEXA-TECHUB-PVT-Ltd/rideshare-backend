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

// TODO : Make sure don't get the deactivated users
// TODO : Display the error when deactivated users trying to sign up or login

exports.create = async (req, res) => {
  const { email, password, device_id, type, facebook_access_token, role } =
    req.body;

  try {
    const userAlreadyExists = await checkUserAlreadyExist(email);
    if (userAlreadyExists) {
      return responseHandler(res, 409, false, "User already exists");
    }

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
    // Render the EJS template to a string
    const emailTemplatePath = path.join(
      __dirname,
      "..",
      "..",
      "templates",
      "signup.ejs"
    );
    const dataForEjs = {
      email: email,
    };

    ejs.renderFile(emailTemplatePath, dataForEjs, async (err, htmlContent) => {
      if (err) {
        console.log(err); // Handle error appropriately
        return res.status(500).json({
          status: false,
          message: "Error rendering email template",
        });
      }

      try {
        // Use the rendered HTML content for the email
        const emailSent = await sendEmail(
          email,
          "Sign Up Verification",
          htmlContent
        );

        // Second email content for email verification
        const verificationEmailTemplatePath = path.join(
          __dirname,
          "..",
          "..",
          "templates",
          "verificationEmail.ejs"
        );

        const verificationDataForEjs = {
          email: email,
          verificationCode: otp,
          logo: urls.logo,
          facebook: urls.facebook,
          twitter: urls.twitter,
          instagram: urls.instagram,
        };

        ejs.renderFile(
          verificationEmailTemplatePath,
          verificationDataForEjs,
          async (err, verificationHtmlContent) => {
            if (err) {
              console.error(err);
              return responseHandler(
                res,
                500,
                false,
                "Error rendering email verification template"
              );
            }
            await sendEmail(
              email,
              "Verify Your Email",
              verificationHtmlContent
            );
          }
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
          responseHandler(res, 500, false, emailSent.message);
        }
      } catch (sendEmailError) {
        console.error(sendEmailError);
        responseHandler(res, 500, false, "Error sending verification email");
      }
    });
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.signIn = async (req, res) => {
  const { email, password, type, device_id, role } = req.body;

  const defaultRole = role ? role : "user";

  try {
    const user = await checkUserExists("users", "email", email, [
      { column: "role", value: defaultRole },
    ]);
    if (user.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        `${role === "admin" ? "Admin not found" : "User not found"}`
      );
    }

    if (type === "email") {
      const isPasswordValid = await bcryptjs.compare(
        password,
        user.rows[0].password
      );
      if (!isPasswordValid) {
        return responseHandler(res, 401, false, "Invalid credentials");
      }
    } else {
      // Handle third-party authentication, e.g., Google
      // Assuming the email has already been validated by Google and you trust it
      // No password check needed here
    }

    const payload = {
      userId: user.rows[0].id, // Ensure you are referencing the correct property
      email: user.rows[0].email,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    delete user.rows[0].password;

    return responseHandler(res, 200, true, "Sign-in successful", {
      user: user.rows[0],
      token,
      device_id,
    });
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
    profile_image_id,
    complementary_address,
    post_address,
    phone,
    about,
    insurance_status,
    location,
    chattiness_preference_id,
    music_preference_id,
    smoking_preference_id,
    pets_preference_id,
  } = req.body;

  try {
    const userExists = await checkUserExists("users", "id", id);
    if (userExists.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
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
    if (pets_preference_id !== undefined)
      userData.pets_preference_id = pets_preference_id;
    if (smoking_preference_id !== undefined)
      userData.smoking_preference_id = smoking_preference_id;
    if (music_preference_id !== undefined)
      userData.music_preference_id = music_preference_id;
    if (chattiness_preference_id !== undefined)
      userData.chattiness_preference_id = chattiness_preference_id;
    if (insurance_status !== undefined)
      userData.insurance_status = insurance_status;
    if (location !== undefined) userData.location = location;
    if (profile_image_id !== undefined)
      userData.profile_picture = profile_image_id;

    if (Object.keys(userData).length === 0) {
      return responseHandler(res, 400, false, "No update information provided");
    }

    await updateRecord("users", userData, ["password", "otp", "admin_name"], {
      column: "id",
      value: id,
    });

    const result = await pool.query(
      `SELECT u.*, up.file_name, up.file_type, up.mime_type 
       FROM users u
       LEFT JOIN uploads up ON u.profile_picture = up.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return responseHandler(
        res,
        500,
        false,
        "Error while retrieving updated user data"
      );
    }

    delete result.rows[0].password;
    delete result.rows[0].otp;
    delete result.rows[0].admin_name;

    return responseHandler(
      res,
      200,
      true,
      "User updated successfully!",
      result.rows[0]
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
      { role: defaultRole },
    ]);

    if (user.rowCount === 0) {
      return responseHandler(
        res,
        404,
        false,
        `${role.charAt(0).toUpperCase() + role.slice(1)} not found`
      );
    }

    const user_id = user.rows[0].id;
    const otp = await sendOtp(email, res, user_id);

    return responseHandler(
      res,
      200,
      true,
      `We've sent the verification code to ${email}`,
      { otp }
    );
  } catch (err) {
    console.log(err);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

// verify code for both email and forgot password
exports.verify_otp = async (req, res) => {
  const { email, otp, role } = req.body;
  const defaultRole = role ? role : "user";
  try {
    const user = await checkUserExists("users", "email", email, [
      { role: defaultRole },
    ]);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }

    const validOtp = await checkUserExists("users", "otp", otp);
    if (validOtp.rowCount === 0) {
      return responseHandler(res, 401, false, "Invalid OTP");
    }

    const userData = {
      email_verified: true,
      otp: null,
    };
    const updatedUser = await updateRecord("users", userData, ["password"], {
      column: "email",
      value: email,
    });
    return responseHandler(
      res,
      200,
      true,
      "Otp verified successfully ",
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
      { role: defaultRole },
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
  const defaultRole = role ? role : "user";
  try {
    const user = await checkUserExists("users", "email", email, [
      { role: defaultRole },
    ]);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
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
  return getAll(req, res, "users", "created_at", "*", {
    insurance_status: insurance_status,
  });
};

exports.getAllUsersWithDetails = async (req, res) => {
  const fields = `
  users.*,
  (SELECT json_build_object(
    'id', uploads.id,
    'file_name', uploads.file_name,
    'file_type', uploads.file_type,
    'mime_type', uploads.mime_type
  ) FROM uploads WHERE uploads.id = users.profile_picture) AS profile_picture_details,
(SELECT json_agg(json_build_object(
    'id', preferences.id,
    'type', preferences.type,
    'icon', (SELECT json_build_object(
        'id', uploads.id,
        'file_name', uploads.file_name,
        'file_type', uploads.file_type,
        'mime_type', uploads.mime_type
      ) FROM uploads WHERE uploads.id = preferences.icon),
    'prompt', preferences.prompt
  )) FROM preferences WHERE preferences.id IN (users.chattiness_preference_id, users.music_preference_id, users.smoking_preference_id, users.pets_preference_id)) AS preferences_details,
(SELECT json_agg(json_build_object(
    'id', vehicles_details.id,
    'user_id', vehicles_details.user_id,
    'license_plate_no', vehicles_details.license_plate_no,
    'vehicle_brand', vehicles_details.vehicle_brand,
    'vehicle_model', vehicles_details.vehicle_model,
    'registration_no', vehicles_details.registration_no,
    'driving_license_no', vehicles_details.driving_license_no,
    'license_expiry_date', vehicles_details.license_expiry_date,
    'personal_insurance', vehicles_details.personal_insurance,
    'vehicle_type', (SELECT json_build_object(
        'id', vehicle_types.id,
        'name', vehicle_types.name
      ) FROM vehicle_types WHERE vehicle_types.id = vehicles_details.vehicle_type_id),
    'vehicle_color', (SELECT json_build_object(
        'id', vehicle_colors.id,
        'name', vehicle_colors.name,
        'code', vehicle_colors.code
      ) FROM vehicle_colors WHERE vehicle_colors.id = vehicles_details.vehicle_color_id),
    'created_at', vehicles_details.created_at,
    'updated_at', vehicles_details.updated_at
  )) FROM vehicles_details WHERE vehicles_details.user_id = users.id) AS vehicles_details,
  (SELECT json_agg(json_build_object(
    'id', rides.id,
    'pickup_location', rides.pickup_location,
    'drop_off_location', rides.drop_off_location,
    'ride_date', rides.ride_date,
    'ride_status', rides.ride_status,
    'caution_details', (SELECT json_agg(json_build_object(
      'id', cautions.id,
      'name', cautions.name,
      'uploaded_icon_id', cautions.uploaded_icon_id
    )) FROM unnest(rides.cautions) AS caution_id LEFT JOIN cautions ON cautions.id = caution_id)
  )) FROM rides WHERE rides.user_id = users.id) AS ride_details
`;

  const join = ``; // No need for a JOIN clause since all details are fetched via subqueries

  return getAll(
    req,
    res,
    "users",
    "created_at",
    fields,
    {}, // No additional filters
    join
  );
};

exports.get = async (req, res) => getSingle(req, res, "users");
exports.getUserWithDetails = async (req, res) => {
  const fields = `
    users.*,
    (SELECT json_build_object(
      'id', uploads.id,
      'file_name', uploads.file_name,
      'file_type', uploads.file_type,
      'mime_type', uploads.mime_type
    ) FROM uploads WHERE uploads.id = users.profile_picture) AS profile_picture_details,
(SELECT json_agg(json_build_object(
    'id', preferences.id,
    'type', preferences.type,
    'icon', (SELECT json_build_object(
        'id', uploads.id,
        'file_name', uploads.file_name,
        'file_type', uploads.file_type,
        'mime_type', uploads.mime_type
      ) FROM uploads WHERE uploads.id = preferences.icon),
    'prompt', preferences.prompt
  )) FROM preferences WHERE preferences.id IN (users.chattiness_preference_id, users.music_preference_id, users.smoking_preference_id, users.pets_preference_id)) AS preferences_details,
    (SELECT json_agg(json_build_object(
      'id', vehicles_details.id,
      'user_id', vehicles_details.user_id,
      'license_plate_no', vehicles_details.license_plate_no,
      'vehicle_brand', vehicles_details.vehicle_brand,
      'vehicle_model', vehicles_details.vehicle_model,
      'registration_no', vehicles_details.registration_no,
      'driving_license_no', vehicles_details.driving_license_no,
      'license_expiry_date', vehicles_details.license_expiry_date,
      'personal_insurance', vehicles_details.personal_insurance
    )) FROM vehicles_details WHERE vehicles_details.user_id = users.id) AS vehicles_details,
    (SELECT json_agg(json_build_object(
      'id', rides.id,
      'pickup_location', rides.pickup_location,
      'ride_date', rides.ride_date,
      'ride_status', rides.ride_status
    )) FROM rides WHERE rides.user_id = users.id) AS ride_details
  `;

  const join = ``;

  return getSingle(req, res, "users", "id", fields, join);
};

exports.delete = async (req, res) => deleteSingle(req, res, "users");

exports.deleteAll = async (req, res) => deleteAll(req, res, "users");
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
      deleted_at: "use_current_timestamp",
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
