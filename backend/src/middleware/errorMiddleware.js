const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message;

  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON in request body.";
  } else if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    message = "This value already exists.";
  } else if (err.name === "SequelizeValidationError") {
    statusCode = 400;
    message = err.errors.map((e) => e.message).join(", ");
  } else if (err.name === "SequelizeForeignKeyConstraintError") {
    statusCode = 409;
    message = "This record is linked to other data, so cannot be changed or deleted.";
  }

  if (statusCode === 500) {
    console.error(err);
    message = "Internal Server Error";
  }

  res.status(statusCode).json({ status: "error", message });
};

module.exports = errorHandler;