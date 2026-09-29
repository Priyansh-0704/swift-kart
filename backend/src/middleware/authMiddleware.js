const jwt = require("jsonwebtoken");
const User = require("../models/User");
const CustomError = require("../utils/customError");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new CustomError("Authentication required.", 401));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "username", "role", "status"]
    });

    if (!user) {
      return next(new CustomError("Invalid or expired token.", 401));
    }

    if (user.status === "Banned") {
      return next(new CustomError("This account has been banned.", 403));
    }

    req.user = { id: user.id, username: user.username, role: user.role };

    next();
  } catch (error) {
    next(new CustomError("Invalid or expired token.", 401));
  }
};

module.exports = authMiddleware;