const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

const sendOtpEmail = async (toEmail, otp, purpose = "Email Verification") => {
  const mailOptions = {
    from: `"SwiftKart" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: `SwiftKart ${purpose}`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>SwiftKart ${purpose}</h2>
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

const sendPasswordChangedAlert = async (toEmail) => {
  const mailOptions = {
    from: `"SwiftKart" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: "Your SwiftKart password was changed",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password changed</h2>
        <p>The password on your SwiftKart account was just changed or reset.</p>
        <p>If this was you, no action is needed. If this wasn't you, please contact support right away.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail, sendPasswordChangedAlert };