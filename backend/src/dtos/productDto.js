const Joi = require("joi");

const productSchema = Joi.object({
    name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required(),

    desciption: Joi.string()
    .min(2)
    .trim()
    .required(),

    price: Joi.number()
    .greater(0)
    .precision(2)
    .required(),

    imageUrl: Joi.string()
    .uri()
    .max(255)
    .allow("")
    .optional(),

    discount: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .default(0)
});

module.exports = {productSchema};