const nodemailer = require("nodemailer");
const {
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
  EMAIL_HOST,
} = require("../constants/constants");

const transporter = nodemailer.createTransport({
  service: "gmail",
  // port: 587,
  // secure: false,
  // host: EMAIL_HOST,
  auth: {
    user: EMAIL_USERNAME,
    pass: EMAIL_PASSWORD,
  },
});
const sendEmail = async (email, subject, htmlContent) => {
  try {
    let sendEmailResponse = await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: subject,
      html: htmlContent,
    });

    if (sendEmailResponse.accepted.length > 0) {
      return {
        success: true,
        message: `Email sent successfully to ${email}`,
      };
    } else {
      return {
        success: false,
        message: `Could not send email`,
      };
    }
  } catch (err) {
    console.log(err);
    return {
      success: false,
      message: `Could not send email`,
    };
    // return {
    //   success: false,
    //   message: `Internal server error occurred`,
    // };
  }
};

module.exports = sendEmail;
