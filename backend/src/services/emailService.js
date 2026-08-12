const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport(
    {
        service: "gmail",
        auth:
        {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD
        }
    }
);

async function sendVerificationEmail(email, otp)
{
    await transporter.sendMail(
        {
            from: process.env.MAIL_USER,
            to: email,
            subject: "SwiftKart Email Varification",
            text: `The SwiftKart verification OTP for your email is ${otp}. This OTP is valid for 10 minutes.`
        }
    );
}

module.exports = {sendVerificationEmail};