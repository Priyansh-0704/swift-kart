const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    orderId: {
      type: DataTypes.INTEGER,
      field: "order_id",
      allowNull: false
    },

    productId: {
      type: DataTypes.INTEGER,
      field: "product_id",
      allowNull: false
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    priceAtPurchase: {
      type: DataTypes.DECIMAL(10, 2),
      field: "price_at_purchase",
      allowNull: false
    }
  },
  {
    tableName: "order_items",
    timestamps: false
  }
);

module.exports = OrderItem;