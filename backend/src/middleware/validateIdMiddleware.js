const CustomError = require("../utils/customError");

const validateId = (paramName = "id") => {
  return (req, res, next) => {
    const id = Number(req.params[paramName]);

    if (!Number.isInteger(id) || id < 1) {
      return next(new CustomError("Invalid ID.", 400));
    }

    next();
  };
};

module.exports = validateId;