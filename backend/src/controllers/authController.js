const User = require("../models/User");
const CustomError = require("../utils/customError");
const { sendOtpEmail } = require("../services/emailService");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");
// const { OAuth2Client } = require("google-auth-library");

// const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, username, password } = req.body;

    const existingEmail = await User.findOne({
      where: { email }
    });

    if (existingEmail) {
      return next(new CustomError("Email is already registered.", 400));
    }

    const existingUsername = await User.findOne({
      where: { username }
    });

    if (existingUsername) {
      return next(new CustomError("Username is already taken.", 400));
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const otpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await User.create({
      name,
      email,
      username,
      passwordHash: password,
      authType: "local",
      isVerified: false,
      emailOtpHash: otpHash,
      emailOtpExpiresAt: otpExpiresAt,
      emailOtpAttempts: 0
    });

    await sendOtpEmail(email, otp);

    res.status(201).json({
      message: "Registration started. Verification OTP sent to your email."
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    if (user.isVerified) {
      return next(new CustomError("Email is already verified.", 400));
    }

    if (!user.emailOtpHash) {
      return next(new CustomError("No verification OTP found.", 400));
    }

    if (new Date() > user.emailOtpExpiresAt) {
      return next(
        new CustomError(
          "OTP has expired. Please register again.",
          400
        )
      );
    }

    if (user.emailOtpAttempts >= 5) {
      return next(
        new CustomError(
          "Too many incorrect attempts. Please register again.",
          400
        )
      );
    }

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (otpHash !== user.emailOtpHash) {
      user.emailOtpAttempts += 1;
      await user.save();

      return next(
        new CustomError("Invalid verification code.", 400)
      );
    }

    user.isVerified = true;
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    user.emailOtpAttempts = 0;

    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      message: "Registration successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: usernameOrEmail },
          { username: usernameOrEmail }
        ]
      }
    });

    if (!user || !user.passwordHash) {
      return next(
        new CustomError("Invalid login credentials.", 401)
      );
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return next(
        new CustomError("Invalid login credentials.", 401)
      );
    }

    if (!user.isVerified) {
      return next(
        new CustomError(
          "Please verify your email before logging in.",
          403
        )
      );
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// const googleAuth = async (req, res, next) => {
//   try {
//     const { idToken } = req.body;

//     const ticket = await googleClient.verifyIdToken({
//       idToken,
//       audience: process.env.GOOGLE_CLIENT_ID
//     });

//     const payload = ticket.getPayload();

//     const {
//       sub: googleId,
//       email,
//       name
//     } = payload;

//     if (!email) {
//       return next(
//         new CustomError("Google account email not available.", 400)
//       );
//     }

//     let user = await User.findOne({
//       where: { email }
//     });

//     if (!user) {
//       const username =
//         email.split("@")[0] +
//         "_" +
//         crypto.randomBytes(2).toString("hex");

//       user = await User.create({
//         name: name || "Google User",
//         email,
//         username,
//         googleId,
//         authType: "google",
//         isVerified: true
//       });
//     } else {
//       if (!user.googleId) {
//         user.googleId = googleId;
//       }

//       user.isVerified = true;

//       await user.save();
//     }

//     const token = generateToken(user);

//     res.status(200).json({
//       message: "Google login successful.",
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         username: user.username,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     next(
//       new CustomError(
//         "Google authentication failed.",
//         401
//       )
//     );
//   }
// };

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    if (!user.passwordHash) {
      return next(
        new CustomError(
          "Password change is not available for this account.",
          400
        )
      );
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!passwordMatch) {
      return next(
        new CustomError(
          "Current password is incorrect.",
          400
        )
      );
    }

    user.passwordHash = newPassword;

    await user.save();

    res.status(200).json({
      message: "Password changed successfully."
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "name",
        "email",
        "username",
        "role",
        "authType",
        "isVerified"
      ]
    });

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    res.status(200).json({
      user
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    user.name = name;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  // googleAuth,
  changePassword,
  getProfile,
  updateProfile
};