const Joi = require("joi");

const sendOtpSchema = Joi.object({
  email: Joi.string().email().required().trim()
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required().trim(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    "string.pattern.base": "OTP must contain only numbers"
  })
});

const registerSchema = Joi.object({
  email: Joi.string().email().required().trim(),
  name: Joi.string().min(2).max(25).required().trim(),
  username: Joi.string().min(3).max(25).alphanum().required().trim(),
  password: Joi.string().min(8).required()
});

const loginSchema = Joi.object({
  usernameOrEmail: Joi.string().required().trim(),
  password: Joi.string().required()
});

const googleLoginSchema = Joi.object({
  idToken: Joi.string().required()
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
  loginSchema,
  googleLoginSchema
};