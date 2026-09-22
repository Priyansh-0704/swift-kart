const Joi = require("joi");

const addressSchema = Joi.object({
  label: Joi.string()
    .min(2)
    .max(30)
    .trim()
    .required(),

  fullName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required(),

  phone: Joi.string()
    .min(7)
    .max(15)
    .trim()
    .required(),

  addressLine1: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required(),

  addressLine2: Joi.string()
    .max(100)
    .trim()
    .allow("")
    .required(),

  landmark: Joi.string()
    .max(50)
    .trim()
    .allow("")
    .optional(),

  city: Joi.string()
    .min(2)
    .max(20)
    .trim()
    .required(),

  state: Joi.string()
    .min(2)
    .max(20)
    .trim()
    .required(),

  pincode: Joi.string()
    .min(4)
    .max(10)
    .trim()
    .required(),

  country: Joi.string()
    .min(2)
    .max(40)
    .trim()
    .default("India")
});

module.exports = {
  addressSchema
};