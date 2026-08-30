const jwt = require("jsonwebtoken");
const CustomError = require("../utils/customError");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new CustomError("Authentication required.", 401));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    next(new CustomError("Invalid or expired token.", 401));
  }
};

module.exports = authMiddleware;