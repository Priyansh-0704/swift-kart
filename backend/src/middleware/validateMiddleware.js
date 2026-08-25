const CustomError = require("../utils/customError");

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      return next(new CustomError(messages, 400));
    }
    req.body = value;
    next();
  }
};

module.exports = validate;