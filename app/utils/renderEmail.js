const path = require('path');
const ejs = require('ejs');

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

exports.signupEmailTemplatePath = path.join(
  __dirname,
  "..",
  "templates",
  "signup.ejs"
);

exports.verificationDataForEjs = (email, otp) => {
    return {
      email: email,
      verification_code: otp,
      base_url: process.env.CLOUDINARY_URL,
    };
}

exports.singupDataForEjs = () => {
    return {
      base_url: process.env.CLOUDINARY_URL,
    };
}
exports.rideDataForEjs = () => {
  return {
    base_url: process.env.CLOUDINARY_URL,
  };
};
