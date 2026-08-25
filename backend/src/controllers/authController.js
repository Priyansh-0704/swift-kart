const User = require("../models/User");
const CustomError = require("../utils/customError");
const { sendOtpEmail } = require("../services/emailService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const { Op } = require("sequelize");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ where: { email } });

    if (!user) {
      user = await User.create({
        email,
        authType: "local",
        isVerified: false,
        emailOtpAttempts: 0
      });
    } else if (user.authType === "google") {
      return next(new CustomError("This email is registered via Google Login.", 400));
    }

    user.emailOtpHash = otpHash;
    user.emailOtpExpiresAt = expiresAt;
    user.emailOtpAttempts = 0;
    await user.save();

    await sendOtpEmail(email, otp);
    res.status(200).json({ message: "Verification OTP sent to your email address." });
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !user.emailOtpHash) {
      return next(new CustomError("Invalid request or OTP record missing.", 400));
    }

    if (new Date() > user.emailOtpExpiresAt) {
      return next(new CustomError("OTP has expired. Please request a new one.", 400));
    }

    if (user.emailOtpAttempts >= 5) {
      return next(new CustomError("Too many verification attempts. Please request a new OTP.", 400));
    }

    const verificationHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (verificationHash !== user.emailOtpHash) {
      user.emailOtpAttempts += 1;
      await user.save();
      return next(new CustomError("Invalid verification code.", 400));
    }

    user.isVerified = true;
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    await user.save();

    res.status(200).json({
      message: "Email successfully verified.",
      isProfileComplete: !!user.username
    });
  } catch (err) {
    next(err);
  }
};

const completeProfileRegistration = async (req, res, next) => {
  try {
    const { email, name, username, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !user.isVerified) {
      return next(new CustomError("Email verification is mandatory before completing profile setup.", 400));
    }

    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) {
      return next(new CustomError("Username is already taken.", 400));
    }

    user.name = name;
    user.username = username;
    user.passwordHash = password; //hashed via Sequelize hook
    await user.save();

    const token = generateToken(user);
    res.status(201).json({ message: "Account created successfully.", token });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
      }
    });

    if (!user || !user.passwordHash || user.authType !== "local") {
      return next(new CustomError("Invalid login credentials.", 401));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new CustomError("Invalid login credentials.", 401));
    }

    if (!user.isVerified) {
      return next(new CustomError("Please verify your email profile structure first.", 403));
    }

    const token = generateToken(user);
    res.status(200).json({ message: "Login successful.", token });
  } catch (err) {
    next(err);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ where: { email } });

    if (!user) {
      const generatedUsername = `${email.split("@")[0]}_${crypto.randomBytes(2).toString("hex")}`;
      user = await User.create({
        email,
        name,
        username: generatedUsername,
        googleId,
        authType: "google",
        isVerified: true
      });
    } else if (user.authType === "local") {
      user.googleId = googleId;
      user.authType = "google";
      await user.save();
    }

    const token = generateToken(user);
    res.status(200).json({ message: "Google authentication successful.", token, username: user.username });
  } catch (err) {
    next(new CustomError("Google authentication failed.", 401));
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  completeProfileRegistration,
  login,
  googleAuth
};