const CustomError = require("../utils/customError");

const validateId = (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return next(new CustomError("Invalid ID.", 400));
  }

  next();
};

module.exports = validateId;