const Joi = require("joi");

const addToCartSchema = Joi.object({
  productId: Joi.number().integer().min(1).required(),
  quantity: Joi.number().integer().min(1).max(20).default(1)
});

const updateCartSchema = Joi.object({
  quantity: Joi.number().integer().min(0).max(20).required()
});

module.exports = { addToCartSchema, updateCartSchema };