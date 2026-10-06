const User = require("../models/User");
const CustomError = require("../utils/customError");
const { sendOtpEmail, sendPasswordChangedAlert } = require("../services/emailService");
const { createOtp, clearOtp, checkOtpCooldown, checkOtp } = require("../utils/otpUtils");
const { sendAuthResponse, formatUser } = require("../utils/tokenUtils");
const { getGooglePayload, makeUsername } = require("../utils/googleAuthUtils");

const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

const PASSWORD_RESET_LIMIT = 2;
const PASSWORD_RESET_WINDOW = 24 * 60 * 60 * 1000;

const bannedResponse = (res, user) => {
  return res.status(403).json({
    status: "error",
    code: "ACCOUNT_BANNED",
    message: user.banReason
      ? `Your account has been banned. Reason: ${user.banReason}`
      : "Your account has been banned."
  });
};

const findByUsernameOrEmail = async (usernameOrEmail) => {
  const value = usernameOrEmail.toLowerCase();

  return User.findOne({
    where: {
      [Op.or]: [{ email: value }, { username: value }]
    }
  });
};

const checkPasswordResetLimit = (user) => {
  if (!user.passwordResetWindowStart) {
    return;
  }

  const elapsed = Date.now() - user.passwordResetWindowStart.getTime();

  if (elapsed < PASSWORD_RESET_WINDOW && user.passwordResetCount >= PASSWORD_RESET_LIMIT) {
    throw new CustomError("Too many password resets today. Please try again tomorrow.", 429);
  }
};

const recordPasswordReset = (user) => {
  const now = new Date();
  const elapsed = user.passwordResetWindowStart ? now - user.passwordResetWindowStart : Infinity;

  if (elapsed > PASSWORD_RESET_WINDOW) {
    user.passwordResetWindowStart = now;
    user.passwordResetCount = 1;
  } else {
    user.passwordResetCount += 1;
  }
};

const notifyPasswordChanged = async (email) => {
  try {
    await sendPasswordChangedAlert(email);
  } catch (error) { }
};

const register = async (req, res, next) => {
  try {
    const { name, email, username, password } = req.body;

    const existingEmail = await User.findOne({ where: { email } });

    if (existingEmail && existingEmail.isVerified) {
      return next(new CustomError("Email is already registered.", 400));
    }

    const existingUsername = await User.findOne({ where: { username } });

    if (existingUsername && (!existingEmail || existingUsername.id !== existingEmail.id)) {
      return next(new CustomError("Username is already taken.", 400));
    }

    let user = existingEmail;

    if (user) {
      checkOtpCooldown(user);
    }

    const { otp, fields } = createOtp("register");

    if (user) {
      user.set({ name, username, passwordHash: password, ...fields });
      await user.save();
    } else {
      user = await User.create({ name, email, username, passwordHash: password, isVerified: false, ...fields });
    }

    try {
      await sendOtpEmail(email, otp);
    } catch (error) {
      if (!existingEmail) {
        await user.destroy();
      }
      return next(new CustomError("Unable to send verification email.", 500));
    }

    res.status(201).json({ message: existingEmail ? "A new verification OTP has been sent to your email." : "Registration started. Verification OTP sent to your email." });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    const genericMessage = "If this email is registered and pending verification, a new verification OTP has been sent.";

    if (!user || user.isVerified) {
      return res.status(200).json({ message: genericMessage });
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

    res.status(200).json({ message: genericMessage });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return next(new CustomError("Invalid verification code or email.", 400));
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
    const user = await findByUsernameOrEmail(usernameOrEmail);

    if (!user) {
      return next(new CustomError("Invalid login credentials.", 401));
    }

    if (!user.passwordHash) {
      return res.status(409).json({status: "error", code: "PASSWORD_NOT_SET", message: "This account has no password yet. Use \"Forgot password\" to set one, or log in with Google." });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return next(new CustomError("Invalid login credentials.", 401));
    }
    if (user.status === "Banned") {
      return bannedResponse(res, user);
    }
    if (!user.isVerified) {
      return res.status(403).json({status: "error", code: "EMAIL_NOT_VERIFIED", message: "Please verify your email before logging in."});
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
      email, username, passwordHash: null, googleId, isVerified: true
    });

    sendAuthResponse(res, user, "Google registration successful.");
  } catch (error) {
    next(error);
  }
};

const requestPasswordResetOtp = async (req, res, next) => {
  try {
    const { usernameOrEmail } = req.body;

    const user = await findByUsernameOrEmail(usernameOrEmail);

    const genericMessage = "If an account exists with those details, a password reset OTP has been sent.";

    if (!user || user.status === "Banned" || !user.isVerified) {
      return res.status(200).json({ message: genericMessage });
    }

    checkPasswordResetLimit(user);
    checkOtpCooldown(user);
    const { otp, fields } = createOtp("set_password");
    user.set(fields);
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, "Password Reset");
    } catch (error) {
      clearOtp(user);
      await user.save();
      return next(new CustomError("Unable to send verification email.", 500));
    }

    res.status(200).json({ message: genericMessage });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { usernameOrEmail, otp, newPassword } = req.body;
    const user = await findByUsernameOrEmail(usernameOrEmail);

    if (!user) {
      return next(new CustomError("Invalid verification code or details.", 400));
    }
    if (user.status === "Banned") {
      return bannedResponse(res, user);
    }

    checkPasswordResetLimit(user);
    await checkOtp(user, otp, "set_password");

    user.passwordHash = newPassword;
    user.tokenVersion += 1;
    clearOtp(user);
    recordPasswordReset(user);
    await user.save();

    await notifyPasswordChanged(user.email);

    sendAuthResponse(res, user, "Password set successfully.");
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
        new CustomError("No password is set for this account. Use forgot-password to set one first.", 400)
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
    user.tokenVersion += 1;
    await user.save();

    await notifyPasswordChanged(user.email);

    sendAuthResponse(res, user, "Password changed successfully.");
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
  requestPasswordResetOtp,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile
};