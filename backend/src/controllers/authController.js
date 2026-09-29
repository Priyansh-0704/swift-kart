const User = require("../models/User");
const CustomError = require("../utils/customError");
const { sendOtpEmail } = require("../services/emailService");
const { createOtp, clearOtp, checkOtpCooldown, checkOtp } = require("../utils/otpUtils");
const { sendAuthResponse, formatUser } = require("../utils/tokenUtils");
const { getGooglePayload, makeUsername } = require("../utils/googleAuthUtils");

const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

const bannedResponse = (res, user) => {
  return res.status(403).json({
    status: "error",
    code: "ACCOUNT_BANNED",
    message: user.banReason
      ? `Your account has been banned. Reason: ${user.banReason}`
      : "Your account has been banned."
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, username, password } = req.body;

    const existingEmail = await User.findOne({ where: { email } });

    if (existingEmail) {
      if (existingEmail.isVerified) {
        return next(new CustomError("Email is already registered.", 400));
      }

      return res.status(409).json({
        status: "error",
        code: "PENDING_VERIFICATION",
        message: "An account with this email is already awaiting verification. Verify it or request a new OTP."
      });
    }

    const existingUsername = await User.findOne({ where: { username } });

    if (existingUsername) {
      return next(new CustomError("Username is already taken.", 400));
    }

    const { otp, fields } = createOtp("register");

    const user = await User.create({
      name,
      email,
      username,
      passwordHash: password,
      isVerified: false,
      ...fields
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (error) {
      await user.destroy();
      return next(new CustomError("Unable to send verification email.", 500));
    }

    res.status(201).json({
      message: "Registration started. Verification OTP sent to your email."
    });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return next(new CustomError("No account found with this email.", 404));
    }

    if (user.isVerified) {
      return next(new CustomError("Email is already verified.", 400));
    }

    checkOtpCooldown(user);

    const { otp, fields } = createOtp("register");
    user.set(fields);
    await user.save();

    try {
      await sendOtpEmail(email, otp);
    } catch (error) {
      return next(new CustomError("Unable to send verification email.", 500));
    }

    res.status(200).json({ message: "A new verification OTP has been sent." });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    if (user.isVerified) {
      return next(new CustomError("Email is already verified.", 400));
    }

    await checkOtp(user, otp, "register");

    user.isVerified = true;
    clearOtp(user);
    await user.save();

    sendAuthResponse(res, user, "Registration successful.");
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const loginValue = usernameOrEmail.toLowerCase();

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: loginValue }, { username: loginValue }]
      }
    });

    if (!user) {
      return next(new CustomError("Invalid login credentials.", 401));
    }

    if (!user.passwordHash) {
      return res.status(409).json({
        status: "error",
        code: "PASSWORD_NOT_SET",
        message:
          "This account was created with Google. Please log in with Google, then set a password from your profile."
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return next(new CustomError("Invalid login credentials.", 401));
    }

    if (user.status === "Banned") {
      return bannedResponse(res, user);
    }

    if (!user.isVerified) {
      return res.status(403).json({
        status: "error",
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before logging in."
      });
    }

    sendAuthResponse(res, user, "Login successful.");
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    const payload = await getGooglePayload(idToken);
    const googleId = payload.sub;
    const email = payload.email.toLowerCase();

    let user = await User.findOne({ where: { googleId } });

    if (user) {
      if (user.status === "Banned") {
        return bannedResponse(res, user);
      }

      return sendAuthResponse(res, user, "Google login successful.");
    }

    const existing = await User.findOne({ where: { email } });

    if (existing) {
      if (existing.isVerified) {
        if (existing.googleId) {
          return next(new CustomError("This email is linked to a different Google account.", 409));
        }

        if (existing.status === "Banned") {
          return bannedResponse(res, existing);
        }

        existing.googleId = googleId;
        await existing.save();

        return sendAuthResponse(res, existing, "Google account linked. Login successful.");
      }

      await existing.destroy();
    }

    const username = await makeUsername(email);

    user = await User.create({
      name: (payload.name || "Google User").slice(0, 25),
      email,
      username,
      passwordHash: null,
      googleId,
      isVerified: true
    });

    sendAuthResponse(res, user, "Google registration successful.");
  } catch (error) {
    next(error);
  }
};

const requestSetPasswordOTP = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    if (user.passwordHash) {
      return next(
        new CustomError("This account already has a password. Use change password instead.", 400)
      );
    }

    checkOtpCooldown(user);

    const { otp, fields } = createOtp("set_password");
    user.set(fields);
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, "Password Setup");
    } catch (error) {
      clearOtp(user);
      await user.save();
      return next(new CustomError("Unable to send verification email.", 500));
    }

    res.status(200).json({ message: "A password setup OTP has been sent to your email." });
  } catch (error) {
    next(error);
  }
};

const setPassword = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    if (user.passwordHash) {
      return next(
        new CustomError("This account already has a password. Use change password instead.", 400)
      );
    }

    await checkOtp(user, otp, "set_password");

    user.passwordHash = newPassword;
    clearOtp(user);
    await user.save();

    res.status(200).json({
      message: "Password created successfully. You can now log in with Google or your password."
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    if (!user.passwordHash) {
      return next(
        new CustomError("No password is set for this account. Please set a password first.", 400)
      );
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!passwordMatch) {
      return next(new CustomError("Current password is incorrect.", 400));
    }

    if (currentPassword === newPassword) {
      return next(new CustomError("New password cannot be the same as the current password.", 400));
    }

    user.passwordHash = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    res.status(200).json({
      user: {
        ...formatUser(user),
        isVerified: user.isVerified,
        hasPassword: !!user.passwordHash,
        googleLinked: !!user.googleId
      }
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
      user: formatUser(user)
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
  requestSetPasswordOTP,
  setPassword,
  changePassword,
  getProfile,
  updateProfile
};