const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    userId: {
      type: DataTypes.INTEGER,
      field: "user_id",
      allowNull: false
    },

    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM("Pending", "Shipped", "Delivered", "Cancelled"),
      allowNull: false,
      defaultValue: "Pending"
    },

    shippingAddress: {
      type: DataTypes.TEXT,
      field: "shipping_address",
      allowNull: false
    },

    razorpayOrderId: {
      type: DataTypes.STRING(100),
      field: "razorpay_order_id",
      allowNull: true
    },

    razorpayPaymentId: {
      type: DataTypes.STRING(100),
      field: "razorpay_payment_id",
      allowNull: true
    },

    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "orders",
    timestamps: false
  }
);

module.exports = Order;