const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
// project files directories
const { pool } = require("../../config/db.config");
const {
  checkUserExists,
  checkUserAlreadyExist,
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
const sendOtp = require("../../utils/sendOTP");

// TODO : Make sure don't get the deactivated users
// TODO : Display the error when deactivated users trying to sign up or login

exports.create = async (req, res) => {
  const { email, password, device_id, type, facebook_access_token } = req.body;

  try {
    const userAlreadyExists = await checkUserAlreadyExist(email);
    if (userAlreadyExists) {
      return responseHandler(res, 409, false, "User already exists");
    }

    let hashedPassword;
    let userData = {
      email,
      device_id,
      type,
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

    await sendEmail(
      email,
      "Sign Up Verification",
      `Thanks for signing up. Your code to verify is: ${otp}`
    );

    return responseHandler(
      res,
      201,
      true,
      "User created successfully! please verify your email",
      newUser
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.signIn = async (req, res) => {
  const { email, password, facebook_access_token, type } = req.body;

  try {
    const user = await checkUserExists("users", "email", email);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
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
      if (facebook_access_token !== user.facebook_access_token) {
        return responseHandler(res, 401, false, "Invalid Facebook token");
      }
    }

    const payload = {
      userId: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    delete user.rows[0].password;

    return responseHandler(res, 200, true, "Sign-in successful", {
      user: user.rows[0],
      token,
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
  } = req.body;

  try {
    const user = await checkUserExists("users", "id", id);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }

    let userData = {
      last_name,
      first_name,
      date_of_birth,
      gender,
      profile_picture: profile_image_id,
    };

    // Call the update function
    const updatedUser = await updateRecord("users", userData, ["password", "otp"], {
      column: "id",
      value: id,
    });

    if (!updatedUser) {
      return responseHandler(res, 500, false, "Error while updating user");
    }


    return responseHandler(
      res,
      200,
      true,
      "User updated successfully!",
      updatedUser
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await checkUserExists("users", "email", email);
    if (user.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found");
    }

    const user_id = user.rows[0].id;

    const otp = await sendOtp(email, res, user_id);
    return responseHandler(
      res,
      200,
      true,
      "We've send the verification code on " + email,
      { otp }
    );
  } catch (err) {
    console.log(err);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

// verify code for both email and forgot password
exports.verify_otp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await checkUserExists("users", "email", email);
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
  const { email, new_password } = req.body;
  try {
    const user = await checkUserExists("users", "email", email);
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
  const { email, old_password, new_password } = req.body;
  try {
    const user = await checkUserExists("users", "email", email);
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
  getAll(req, res, "users", "id", "*", { block_status: true });

exports.get = async (req, res) => getSingle(req, res, "users");
exports.delete = async (req, res) => deleteSingle(req, res, "users");
exports.deleteAll = async (req, res) => deleteAll(req, res, "users");
exports.search = async (req, res) =>
  search(req, res, "users", ["first_name", "email"], "id", "", "", [
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
