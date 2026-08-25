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
    from: `"SwiftKart Support" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: "Your SwiftKart Verification Code",
    html: `
      <div style="font-family: Arial;">
        <h2>Welcome to SwiftKart!</h2>
        <p>Use the verification code below to complete your authentication process. This code is valid for 10 minutes.</p>
        <h1 style="color: #4F46E5; letter-spacing: 4px;">${otp}</h1>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };