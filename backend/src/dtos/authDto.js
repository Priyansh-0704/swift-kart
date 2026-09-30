const Joi = require("joi");

const email = Joi.string().email().lowercase().trim().max(100).required();

const otp = Joi.string()
  .length(6)
  .pattern(/^\d+$/)
  .required()
  .messages({ "string.pattern.base": "OTP must contain only numbers." });

const password = Joi.string().min(8).max(72).required();

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(25).trim().required(),
  email,
  username: Joi.string().min(3).max(25).alphanum().lowercase().trim().required(),
  password
});

const verifyOtpSchema = Joi.object({ email, otp });

const resendOtpSchema = Joi.object({ email });

const loginSchema = Joi.object({
  usernameOrEmail: Joi.string().trim().required(),
  password: Joi.string().required()
});

const googleSchema = Joi.object({
  idToken: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: password
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(25).trim().required()
});

const forgotPasswordRequestSchema = Joi.object({
  usernameOrEmail: Joi.string().trim().required()
});

const forgotPasswordResetSchema = Joi.object({
  usernameOrEmail: Joi.string().trim().required(),
  otp,
  newPassword: password
});

module.exports = {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  googleSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordRequestSchema,
  forgotPasswordResetSchema
};