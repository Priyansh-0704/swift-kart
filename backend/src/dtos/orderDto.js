const Joi = require("joi");

const updateStatusSchema = Joi.object({
  status: Joi.string().valid("Shipped", "Delivered", "Cancelled").required()
});

module.exports = { updateStatusSchema };