const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(25).trim().required(),
  email: Joi.string().email().trim().required(),
  username: Joi.string().min(3).max(25).alphanum().trim().required(),
  password: Joi.string().min(8).required()
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().trim().required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
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
  loginSchema,
  googleSchema,
  changePasswordSchema,
  updateProfileSchema
};