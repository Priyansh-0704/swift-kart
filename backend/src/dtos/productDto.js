const Joi = require("joi");

const productSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required(),

  description: Joi.string().min(2).max(1000).trim().required(),

  price: Joi.number().greater(0).max(99999999.99).precision(2).required(),

  discount: Joi.number().min(0).max(100).precision(2).default(0)
});

module.exports = { productSchema };