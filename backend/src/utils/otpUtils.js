const crypto = require("crypto");
const CustomError = require("./customError");

const OTP_LIFETIME = 10 * 60 * 1000;
const OTP_COOLDOWN = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const createOtp = (purpose) => {
  const otp = crypto.randomInt(100000, 1000000).toString();

  return {
    otp,
    fields: {
      emailOtpHash: hashOtp(otp),
      emailOtpExpiresAt: new Date(Date.now() + OTP_LIFETIME),
      emailOtpAttempts: 0,
      emailOtpPurpose: purpose
    }
  };
};

const clearOtp = (user) => {
  user.emailOtpHash = null;
  user.emailOtpExpiresAt = null;
  user.emailOtpAttempts = 0;
  user.emailOtpPurpose = null;
};

const checkOtpCooldown = (user) => {
  if (!user.emailOtpExpiresAt) {
    return;
  }

  const sentAt = user.emailOtpExpiresAt.getTime() - OTP_LIFETIME;

  if (Date.now() - sentAt < OTP_COOLDOWN) {
    throw new CustomError("Please wait a minute before requesting another OTP.", 429);
  }
};

const checkOtp = async (user, otp, purpose) => {
  if (user.emailOtpPurpose !== purpose || !user.emailOtpHash) {
    throw new CustomError("No active OTP found. Please request a new one.", 400);
  }

  if (!user.emailOtpExpiresAt || new Date() > user.emailOtpExpiresAt) {
    throw new CustomError("OTP has expired. Please request a new one.", 400);
  }

  if (user.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
    throw new CustomError("Too many incorrect attempts. Please request a new OTP.", 400);
  }

  if (hashOtp(otp) !== user.emailOtpHash) {
    user.emailOtpAttempts += 1;
    await user.save();
    throw new CustomError("Invalid verification code.", 400);
  }
};

module.exports = { createOtp, clearOtp, checkOtpCooldown, checkOtp };