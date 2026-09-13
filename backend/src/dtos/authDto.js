const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(25).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  username: Joi.string().min(3).max(25).alphanum().lowercase().trim().required(),
  password: Joi.string().min(8).required()
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({"string.pattern.base": "OTP must contain only numbers."})
});

const resendOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
});

const loginSchema = Joi.object({
  usernameOrEmail: Joi.string().trim().required(),
  password: Joi.string().required()
});

const googleSchema = Joi.object({
  idToken: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(25).trim().required()
});

module.exports = {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  googleSchema,
  changePasswordSchema,
  updateProfileSchema
};