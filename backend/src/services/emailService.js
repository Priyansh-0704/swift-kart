const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"SwiftKart" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: "SwiftKart Email Verification",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>SwiftKart Email Verification</h2>
        <p>Your verification code is:</p>
        <h1>${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <br>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };