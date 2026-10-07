const Joi = require("joi");

const addressSchema = Joi.object({
  label: Joi.string().min(2).max(30).trim().required(),

  fullName: Joi.string().min(2).max(50).trim().required(),

  phone: Joi.string()
    .pattern(/^[0-9+\-\s]{10,15}$/)
    .trim()
    .required()
    .messages({ "string.pattern.base": "Phone number is not valid." }),

  addressLine1: Joi.string().min(2).max(100).trim().required(),

  addressLine2: Joi.string().max(100).trim().allow("").optional(),

  landmark: Joi.string().max(50).trim().allow("").optional(),

  city: Joi.string().min(2).max(50).trim().required(),

  state: Joi.string().min(2).max(50).trim().required(),

  pincode: Joi.string()
    .pattern(/^\d{6}$/)
    .trim()
    .required()
    .messages({ "string.pattern.base": "Pincode must be 6 digits." }),

  country: Joi.string().min(2).max(40).trim().default("India")
});

module.exports = { addressSchema };