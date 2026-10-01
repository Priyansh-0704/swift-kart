const crypto = require("crypto");
const sequelize = require("../config/database");
const razorpay = require("../config/razorpay");
const CustomError = require("../utils/customError");
const { CartItem, Product, UserAddress, Order, OrderItem } = require("../models/Index"); 

const loadCartForCheckout = async (userId) => {
  const items = await CartItem.findAll({
    where: { userId },
    include: [{ model: Product }]
  });

  if (items.length === 0) {
    throw new CustomError("Your cart is empty.", 400);
  }

  const unavailable = items.filter((item) => item.Product.status !== "Available");

  if (unavailable.length > 0) {
    const names = unavailable.map((item) => item.Product.name).join(", ");
    throw new CustomError(`These items are no longer available: ${names}`, 400);
  }

  const total = items.reduce((sum, item) => sum + Number(item.Product.finalPrice) * item.quantity, 0);

  return { items, total: Number(total.toFixed(2)) };
};

const formatAddress = (address) => {
  return [
    address.fullName,
    address.phone,
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    `${address.city}, ${address.state} ${address.pincode}`,
    address.country
  ]
    .filter(Boolean)
    .join(", ");
};

const createRazorpayOrder = async (req, res, next) => {
  try {
    const { addressId } = req.body;

    const address = await UserAddress.findOne({ where: { id: addressId, userId: req.user.id } });

    if (!address) {
      return next(new CustomError("Address not found.", 404));
    }

    const { total } = await loadCartForCheckout(req.user.id);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: `rcpt_${req.user.id}_${Date.now()}`
    });

    res.status(200).json({
      razorpayOrderId: razorpayOrder.id,
      amount: total,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    next(error);
  }
};

const verifyAndPlaceOrder = async (req, res, next) => {
  try {
    const { addressId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return next(new CustomError("Payment verification failed.", 400));
    }

    const address = await UserAddress.findOne({ where: { id: addressId, userId: req.user.id } });

    if (!address) {
      return next(new CustomError("Address not found.", 404));
    }

    const { items, total } = await loadCartForCheckout(req.user.id);

    const order = await sequelize.transaction(async (t) => {
      const newOrder = await Order.create(
        {
          userId: req.user.id,
          cost: total,
          status: "Pending",
          shippingAddress: formatAddress(address),
          razorpayOrderId,
          razorpayPaymentId
        },
        { transaction: t }
      );

      const orderItems = items.map((item) => ({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.Product.finalPrice
      }));

      await OrderItem.bulkCreate(orderItems, { transaction: t });
      await CartItem.destroy({ where: { userId: req.user.id }, transaction: t });

      return newOrder;
    });

    res.status(201).json({ message: "Order placed successfully.", order });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRazorpayOrder, verifyAndPlaceOrder };