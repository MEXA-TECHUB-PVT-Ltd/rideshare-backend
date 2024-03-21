const path = require("path");
const ejs = require("ejs");

exports.renderEJSTemplate = async (templatePath, data) => {
  return new Promise((resolve, reject) => {
    ejs.renderFile(templatePath, data, (err, htmlContent) => {
      if (err) {
        return reject(err);
      }
      resolve(htmlContent);
    });
  });
};

exports.forgetEmailTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "forgetPassword.ejs"
);
exports.verificationEmailTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "verificationEmail.ejs"
);

exports.rideEmailTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "ride.ejs"
);
exports.rideNotifyEmailTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "notifyEmail.ejs"
);
exports.publisherRideEmailTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "joinRideDriver.ejs"
);
exports.joinRideEmailTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "joinRidePassenger.ejs"
);

exports.signupEmailTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "signup.ejs"
);

exports.driverVerEmailTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "driverVerification.ejs"
);

exports.verificationDataForEjs = (email, otp, year) => {
  return {
    email: email,
    verification_code: otp,
    year,
    base_url: process.env.CLOUDINARY_URL,
  };
};

exports.singupDataForEjs = (year) => {
  return {
    year,
    base_url: process.env.CLOUDINARY_URL,
  };
};
exports.rideDataForEjs = (email, year, date) => {
  return {
    email,
    year,
    date,
    base_url: process.env.CLOUDINARY_URL,
  };
};
exports.driverVerificationDataForEjs = (email, year, date, license_number, expiry_date) => {
  return {
    email,
    year,
    date,
    license_number,
    expiry_date,
  };
};
exports.rideNotifyDataForEjs = (
  email,
  year,
  date,
  pickup_address,
  drop_off_address
) => {
  return {
    email,
    year,
    date,
    pickup_address,
    drop_off_address,
  };
};
exports.publisherRiderJoinEjs = (email, year, date, emailData) => {
  return {
    email,
    year,
    date,
    destination_from: emailData.pickup,
    destination_to: emailData.dropOff,
    rideDate: emailData.rideDate,
    pickupTime: emailData.pickupTime,
    base_url: process.env.CLOUDINARY_URL,
  };
};
exports.joinRideEjs = (email, year, date, emailData) => {
  return {
    email,
    year,
    date,
    destination_from: emailData.pickup,
    destination_to: emailData.dropOff,
    rideDate: emailData.rideDate,
    pickupTime: emailData.pickupTime,
    base_url: process.env.CLOUDINARY_URL,
  };
};
