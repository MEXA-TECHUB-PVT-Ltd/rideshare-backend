const sendEmail = require("../../lib/sendEmail");
const { responseHandler } = require("../../utils/commonResponse");
const {
  createRecord,
  getAll,
  getSingle,
  updateRecord,
} = require("../../utils/dbHeplerFunc");
const { checkUserExists } = require("../../utils/dbValidations");
const {
  rideDataForEjs,
  renderEJSTemplate,
  driverVerEmailTemplatePath,
  driverVerificationDataForEjs,
} = require("../../utils/renderEmail");

exports.create = async (req, res) => {
  const { user_id, license_number, expiry_date, front_image, back_image } =
    req.body;

  const driverVerificationData = {
    user_id,
    license_number,
    expiry_date,
    front_image,
    back_image,
    is_expire: false,
  };

  let result;

  try {
    const userExists = await checkUserExists("users", "id", user_id);
    const driverVerificationRequestExists = await checkUserExists(
      "driver_verification_request",
      "user_id",
      user_id
    );
    if (userExists.rowCount === 0) {
      return responseHandler(res, 404, false, "User not found ");
    }
    if (driverVerificationRequestExists.rowCount === 0) {
      result = await createRecord(
        "driver_verification_request",
        driverVerificationData,
        []
      );
    } else {
      result = await updateRecord(
        "driver_verification_request",
        driverVerificationData,
        [],
        {
          column: "user_id",
          value: user_id,
        }
      );
    }

    if (result.error) {
      return responseHandler(res, result.status, false, result.message);
    }

    //   send email to admin
    try {
      const currentYear = new Date().getFullYear();
      const date = new Date().toLocaleDateString();
      const email = process.env.ADMIN_EMAIL || "chiraastudio@gmail.com";
      const emailData = driverVerificationDataForEjs(
        userExists.rows[0].email,
        currentYear,
        date,
        license_number,
        expiry_date
      );
      const emailHtmlContent = await renderEJSTemplate(
        driverVerEmailTemplatePath,
        emailData
      );
      const emailSent = await sendEmail(
        email,
        "Ride Approval Request for EZEPZE Driver",
        emailHtmlContent
      );

      if (!emailSent.success) {
        console.error(emailSent.message);
      }
    } catch (sendEmailError) {
      console.error(sendEmailError);
    }
    const data = result.data || result;
    return responseHandler(
      res,
      201,
      true,
      "Request submitted successfully!",
      data
    );
  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

// when update the license details is_expire must be false;

exports.update = async (req, res) => {
  const { id, license_number, expiry_date, front_image, back_image } = req.body;
  try {
    const userExists = await checkUserExists(
      "driver_verification_request",
      "id",
      id
    );
    if (userExists.rowCount === 0) {
      return responseHandler(res, 404, false, "Record not found");
    }
    const driverVerificationData = { is_expire: false };

    if (license_number !== undefined)
      driverVerificationData.license_number = license_number;
    if (expiry_date !== undefined)
      driverVerificationData.expiry_date = expiry_date;
    if (front_image !== undefined)
      driverVerificationData.front_image = front_image;
    if (back_image !== undefined)
      driverVerificationData.back_image = back_image;

    const result = await updateRecord(
      "driver_verification_request",
      driverVerificationData,
      [],
      {
        column: "id",
        value: id,
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

exports.getAll = async (req, res) => {
  const fields = `
    drv.*,
    json_build_object(
      'id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'email', u.email,
      'profile_uri', u.profile_uri,
      'is_verified_driver', u.is_verified_driver
    ) as user_details`;

  // JOIN clause to get user details
  const join = `
    LEFT JOIN users u ON drv.user_id = u.id`;

  getAll(
    req,
    res,
    "driver_verification_request drv",
    "drv.created_at",
    fields,
    {},
    join
  );
};

exports.get = async (req, res) => {
  const tableName = "driver_verification_request";
  const fields = `*`;

  return getSingle(req, res, tableName, "id", fields);
};

exports.getOneByUser = async (req, res) => {
  const user_id = req.params.userId;
  try {
    const driverVerificationRequestExists = await checkUserExists(
      "driver_verification_request",
      "user_id",
      user_id
    );
    if (driverVerificationRequestExists.rowCount === 0) {
      return responseHandler(res, 404, false, "Request not found for user ");
    }
    return responseHandler(
      res,
      200,
      true,
      "User status updated successfully!",
      driverVerificationRequestExists.rows[0]
    );
  } catch (error) {
    console.log(error);
    return responseHandler(res, 500, false, "Internal Server Error");
  }
};

exports.getByUser = async (req, res) => {
  const user_id = parseInt(req.params.user_id, 10);
  const fields = `
    drv.*,
    json_build_object(
      'id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'email', u.email,
      'profile_uri', u.profile_uri,
      'is_verified_driver', u.is_verified_driver
    ) as user_details`;

  // JOIN clause to get user details
  const join = `
    LEFT JOIN users u ON drv.user_id = u.id`;
  const additionalFilters = {
    "drv.user_id": user_id,
  };
  getAll(
    req,
    res,
    "driver_verification_request drv",
    "drv.created_at",
    fields,
    additionalFilters,
    join
  );
};
