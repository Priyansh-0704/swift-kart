const User = require("../models/User");
const CustomError = require("../utils/customError");

const PUBLIC_ATTRS = ["id", "name", "email", "username", "role", "status", "banReason", "isVerified", "googleId"];

const formatAdminUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role,
  status: user.status,
  banReason: user.banReason,
  isVerified: user.isVerified,
  googleLinked: Boolean(user.googleId)
});

const getUsers = async (req, res, next) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!Number.isInteger(page) || page < 1) {
      return next(new CustomError("Page must be a positive integer.", 400));
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return next(new CustomError("Limit must be a positive integer between 1 and 50.", 400));
    }

    const where = {};

    if (req.query.role) {
      if (!["Customer", "Admin"].includes(req.query.role)) {
        return next(new CustomError("Role must be Customer or Admin.", 400));
      }
      where.role = req.query.role;
    }

    if (req.query.status) {
      if (!["Active", "Banned"].includes(req.query.status)) {
        return next(new CustomError("Status must be Active or Banned.", 400));
      }
      where.status = req.query.status;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: PUBLIC_ATTRS,
      order: [["id", "DESC"]],
      limit,
      offset: (page - 1) * limit
    });

    res.status(200).json({
      users: rows.map(formatAdminUser),
      pagination: {
        currentPage: page,
        limit,
        totalUsers: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(Number(req.params.id), { attributes: PUBLIC_ATTRS });

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    res.status(200).json({ user: formatAdminUser(user) });
  } catch (error) {
    next(error);
  }
};

const banUser = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);

    if (targetId === req.user.id) {
      return next(new CustomError("You cannot ban your own account.", 400));
    }

    const user = await User.findByPk(targetId);

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    if (user.role === "Admin") {
      return next(new CustomError("Admin accounts cannot be banned.", 400));
    }

    if (user.status === "Banned") {
      return next(new CustomError("This user is already banned.", 400));
    }

    user.status = "Banned";
    user.banReason = req.body.reason;
    user.tokenVersion += 1;
    await user.save();

    res.status(200).json({
      message: "User banned successfully.",
      user: { id: user.id, status: user.status, banReason: user.banReason }
    });
  } catch (error) {
    next(error);
  }
};

const unbanUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(Number(req.params.id));

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    if (user.status === "Active") {
      return next(new CustomError("This user is not banned.", 400));
    }

    user.status = "Active";
    user.banReason = null;
    await user.save();

    res.status(200).json({
      message: "User unbanned successfully.",
      user: { id: user.id, status: user.status }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, banUser, unbanUser };