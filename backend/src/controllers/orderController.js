const { Order, OrderItem, Product } = require("../models/Index");
const CustomError = require("../utils/customError");

const ORDER_INCLUDE = [{
    model: OrderItem,
    include: [{ model: Product, attributes: ["id", "name", "imageUrl"] }]
}];

const CUSTOMER_CANCELABLE = ["Pending"];
const ADMIN_TRANSITIONS = {
  Pending: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: []
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({where: { userId: req.user.id },include: ORDER_INCLUDE, order: [["id", "DESC"]]});
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

const getMyOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ where: { id: Number(req.params.id), userId: req.user.id }, include: ORDER_INCLUDE });

    if (!order) {
      return next(new CustomError("Order not found.", 404));
    }

    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

const cancelMyOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ where: { id: Number(req.params.id), userId: req.user.id }});

    if (!order) {
      return next(new CustomError("Order not found.", 404));
    }

    if (!CUSTOMER_CANCELABLE.includes(order.status)) {
      return next(new CustomError(`An order that is ${order.status} can no longer be cancelled.`, 400));
    }

    order.status = "Cancelled";
    await order.save();

    res.status(200).json({ message: "Order cancelled.", order });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
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

    if (req.query.status) {
      const valid = ["Pending", "Shipped", "Delivered", "Cancelled"];

      if (!valid.includes(req.query.status)) {
        return next(new CustomError("Invalid status filter.", 400));
      }

      where.status = req.query.status;
    }

    const { count, rows } = await Order.findAndCountAll({ where, include: ORDER_INCLUDE, order: [["id", "DESC"]], limit,offset: (page - 1) * limit });

    res.status(200).json({
      orders: rows,
      pagination: {
        currentPage: page,
        limit,
        totalOrders: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findByPk(Number(req.params.id), { include: ORDER_INCLUDE });

    if (!order) {
      return next(new CustomError("Order not found.", 404));
    }

    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findByPk(Number(req.params.id));

    if (!order) {
      return next(new CustomError("Order not found.", 404));
    }

    const { status } = req.body;
    const allowed = ADMIN_TRANSITIONS[order.status] || [];

    if (!allowed.includes(status)) {
      return next(new CustomError(`Cannot move an order from ${order.status} to ${status}.`, 400));
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: "Order status updated.", order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus
};