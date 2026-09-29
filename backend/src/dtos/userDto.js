const Joi = require("joi");

const banSchema = Joi.object({
  reason: Joi.string().min(3).max(255).trim().required()
});

module.exports = { banSchema };