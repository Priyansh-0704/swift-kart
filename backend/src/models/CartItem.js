const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CartItem = sequelize.define(
  "CartItem",
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

    productId: {
      type: DataTypes.INTEGER,
      field: "product_id",
      allowNull: false
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  },
  {
    tableName: "cart_items",
    timestamps: false,
    indexes: [{ unique: true, fields: ["user_id", "product_id"] }]
  }
);

module.exports = CartItem;