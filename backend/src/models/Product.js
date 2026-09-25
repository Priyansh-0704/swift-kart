const { DataTypes } = require("sequelize")
const sequelize = require("../config/database");

const Product = sequelize.define(
    "Product",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        imageUrl: {
            type: DataTypes.STRING(255),
            field: "image_url",
            allowNull: true
        },

        status: {
            type: DataTypes.ENUM(
                "Available",
                "Unavailable"
            ),
            allowNull: false,
            defaultValue: "Available"
        },

        discount: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: false,
            defaultValue: 0
        },

        finalPrice: {
            type: DataTypes.DECIMAL(10,2),
            field: "final_price",
            allowNull: false
        }
    },
    {
        tableName: "products",
        timestamps: false
    }
);

module.exports = Product;