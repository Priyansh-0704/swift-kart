const User = require("../models/User");
const CustomError = require("../utils/customError");
const { sendOtpEmail } = require("../services/emailService");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const createOtp = () => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  return {
    otp,
    otpHash,
    expiresAt
  };
};

const clearOtp = (user) => {
  user.emailOtpHash = null;
  user.emailOtpExpiresAt = null;
  user.emailOtpAttempts = 0;
  user.emailOtpPurpose = null;
}

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

    const {
      otp,
      otpHash,
      expiresAt
    } = createOtp();

    const user = await User.create({
      name,
      email,
      username,
      passwordHash: password,
      authType: "local",
      isVerified: false,
      emailOtpHash: otpHash,
      emailOtpExpiresAt: expiresAt,
      emailOtpAttempts: 0,
      emailOtpPurpose: "register"
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (error) {
      await user.destroy();

      return next(
        new CustomError(
          "Unable to send verification email.",
          500
        )
      );
    }

    res.status(201).json({
      message:
        "Registration started. Verification OTP sent to your email."
    });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return next(
        new CustomError(
          "No account found with this email.",
          404
        )
      );
    }

    if (user.isVerified) {
      return next(
        new CustomError(
          "Email is already verified.",
          400
        )
      );
    }

    if (user.authType !== "local") {
      return next(
        new CustomError(
          "This account uses Google login.",
          400
        )
      );
    }

    const {
      otp,
      otpHash,
      expiresAt
    } = createOtp();

    user.emailOtpHash = otpHash;
    user.emailOtpExpiresAt = expiresAt;
    user.emailOtpAttempts = 0;

    await user.save();

    await sendOtpEmail(email, otp);

    res.status(200).json({
      message: "A new verification OTP has been sent."
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
      return next(new CustomError("User not found.", 404))
    }

    if (user.isVerified) {
      return next(new CustomError("Email is already verified.", 400));
    }

    if (user.emailOtpPurpose !== "register") {
      return next(new CustomError("No registration OTP is active.", 400))
    }

    if (!user.emailOtpHash) {
      return next(new CustomError("No verification OTP found.", 400));
    }

    if (!user.emailOtpExpiresAt || new Date() > user.emailOtpExpiresAt) {
      return next(new CustomError("OTP has expired. Please request a new OTP.",400));
    }

    if (user.emailOtpAttempts >= 5) {
      return next(new CustomError("Too many incorrect attempts. Please request a new OTP.",400));
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    if (otpHash !== user.emailOtpHash) {
      user.emailOtpAttempts += 1;

      await user.save();

      return next(new CustomError("Invalid verification code.",400));
    }

    user.isVerified = true;
    clearOtp(user);

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
    const loginValue = usernameOrEmail.trim().toLowerCase();

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: loginValue },
          { username: loginValue }
        ]
      }
    });

    if (!user) {
      return next(new CustomError("Invalid login credentials.", 401));
    }
    if (!user.passwordHash) {
      return res.status(409).json({
        status: "error",
        code: "PASSWORD_NOT_SET",
        message: "No password is linked to this account. Please use Google login or set a password for this account."
      })
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return next(new CustomError("Invalid login credentials.", 401));
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

const requestSetPasswordOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      where: {
        email: normalizedEmail
      }
    });

    if (!user) {
      return next(new CustomError("No account fornd with this email.", 404))
    }

    if (!user.isVerified) {
      return next(new CustomError("Pleae verify your email first.", 403))
    }

    if (user.passwordHash) {
      return next(new CustomError("This account already has a password, use change password instead.", 400))
    }

    if (!user.googleId) {
      return next(new CustomError("This account does not have a password or linked Google account.", 400))
    }
    const {
      otp, otpHash, expiresAt } = createOtp();

    user.emailOtpHash = otpHash;
    user.emailOtpExpiresAt = expiresAt;
    user.emailOtpAttempts = 0;
    user.emailOtpPurpose = "set_password";

    await user.save();

    try {
      await sendOtpEmail(
        normalizedEmail, otp
      );
    } catch (error) {
      clearOtp(user);
      await user.save();

      return next(new CustomError("Unable to send verification email.", 500))
    }

    res.status(200).json({
      message: "A password setup OTP has been sent to your email."
    });
  } catch (error) {
    next(error);
  }
}

const setPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return next(new CustomError("Invalid email or OTP.", 400)
      );
    }

    if (user.passwordHash) {
      return next(new CustomError("A password is already set for this account. Use change-password instead.", 400));
    }

    if (
      !user.isVerified ||
      !user.googleId
    ) {
      return next(
        new CustomError(
          "This account is not eligible for password setup.",
          400
        )
      );
    }

    if (user.emailOtpPurpose !== "set_password") {
      return next(new CustomError("Please request a new password setup OTP.",400));
    }

    if (!user.emailOtpHash) {
      return next(new CustomError("No active OTP found.",400));
    }

    if (!user.emailOtpExpiresAt || new Date() > user.emailOtpExpiresAt) {
      clearOtp(user);
      await user.save();

      return next(new CustomError("OTP has expired. Please request a new one.",400));
    }

    if (user.emailOtpAttempts >= 5) {
      return next(new CustomError("Too many incorrect attempts. Please request a new OTP.",400));
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== user.emailOtpHash) {
      user.emailOtpAttempts += 1;

      await user.save();

      return next(new CustomError("Invalid verification code.",400));
    }

    // The User.beforeSave hook in our model hashes it with bcrypt.
    user.passwordHash = newPassword;

    clearOtp(user);
    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      message:
        "Password created successfully. You can now log in using Google or your password.",
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

const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const {sub: googleId,email,email_verified,name} = payload;

    if (!email || !email_verified) {
      return next(new CustomError("Google email could not be verified.", 401));
    }

    const normalizedEmail = email.toLowerCase();

    let user = await User.findOne({
      where: { googleId }
    });

    if (user) {
      const token = generateToken(user);

      return res.status(200).json({
        message: "Google login successful.",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role
        }
      });
    }

    user = await User.findOne({
      where: { email: normalizedEmail }
    });

    if (user) {
      return res.status(409).json({
        status: "error",
        code: "ACCOUNT_EXISTS",
        message: "A SwiftKart account already exists with this email. Please log in to that account and link Goigle from your profile"
      })
    }

    let username =
      normalizedEmail.split("@")[0];

    let usernameExists = await User.findOne({
      where: { username }
    });

    while (usernameExists) {
      username = normalizedEmail.split("@")[0] + crypto.randomBytes(2).toString("hex");

      usernameExists = await User.findOne({
        where: { username }
      });
    }

    user = await User.create({
      name: (name || "Google User").slice(0, 25),
      email: normalizedEmail,
      username,
      passwordHash: null,
      authType: "google",
      googleId,
      isVerified: true
    });

    const token = generateToken(user);

    res.status(200).json({
      message: "Google registration successful.",
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
    next(new CustomError("Google authentication failed.", 401));
  }
};

const linkGoogle = async (
  req,
  res,
  next
) => {
  try {
    const { idToken } = req.body;

    const user = await User.findByPk(
      req.user.id
    );

    if (!user) {
      return next(new CustomError("User not found.",404));
    }

    const ticket = await googleClient.verifyIdToken({idToken,audience: process.env.GOOGLE_CLIENT_ID});

    const payload =
      ticket.getPayload();

    const {
      sub: googleId,
      email,
      email_verified
    } = payload;

    if (!email || !email_verified) {
      return next(new CustomError("Google email could not be verified.",401));
    }

    const normalizedEmail =
      email.toLowerCase();

    // Require Google email to match the signed-in SwiftKart account.
    if (
      normalizedEmail !==
      user.email.toLowerCase()
    ) {
      return next(new CustomError("The Google account email must match your SwiftKart email.",400));
    }

    // Check if this Google identity is already linked to another user.
    const existingGoogleUser =
      await User.findOne({
        where: {
          googleId
        }
      });

    if (existingGoogleUser && existingGoogleUser.id !== user.id) {
      return next(new CustomError("This Google account is already linked to another SwiftKart account.",409));
    }

    if (user.googleId === googleId) {
      return res.status(200).json({
        message:
          "This Google account is already linked."
      });
    }

    if (user.googleId) {
      return next(new CustomError("Another Google account is already linked to this SwiftKart account.",400));
    }

    user.googleId = googleId;

    await user.save();

    res.status(200).json({
      message:
        "Google account linked successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(new CustomError("Google account linking failed.",401));
  }
};

const changePassword = async (req, res, next) => {
  try {
    const {
      currentPassword,
      newPassword
    } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    if (!user.passwordHash) {
      return next(new CustomError("Np password is set for this account. Please use the set password process.", 400));
    }

    if (currentPassword == newPassword) {
      return next(new CustomError("New Password cannot be same as the Old Password", 400));
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!passwordMatch) {
      return next(new CustomError("Current password is incorrect.", 400));
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
  resendOtp,
  verifyOtp,
  login,
  googleAuth,
  changePassword,
  getProfile,
  updateProfile,
  requestSetPasswordOTP,
  setPassword,
  linkGoogle
};