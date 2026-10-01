const Joi = require("joi");

const createOrderSchema = Joi.object({
  addressId: Joi.number().integer().min(1).required()
});

const verifyPaymentSchema = Joi.object({
  addressId: Joi.number().integer().min(1).required(),
  razorpayOrderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required()
});

module.exports = { createOrderSchema, verifyPaymentSchema };