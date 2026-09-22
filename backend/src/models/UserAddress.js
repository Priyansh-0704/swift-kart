const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserAddress = sequelize.define(
    "UserAddress",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        userId: {
            type: DataTypes.INTEGER,
            field: "user_id",
            allowNull: false,
            references: {
                model: "users",
                key: "id"
            },
            onDelete: "CASCADE"
        },

        label: {
            type: DataTypes.STRING(30),
            allowNull: false
        },

        fullName: {
            type: DataTypes.STRING(50),
            field: "full_name",
            allowNull: false
        },

        phone: {
            type: DataTypes.STRING(15),
            allowNull: false
        },

        addressLine1: {
            type: DataTypes.STRING(100),
            field: "address_line1",
            allowNull: false
        },

        addressLine2: {
            type: DataTypes.STRING(100),
            field: "address_line2",
            allowNull: false
        },

        landmark: {
            type: DataTypes.STRING(50),
            allowNull: true
        },

        city: {
            type: DataTypes.STRING(20),
            allowNull: false
        },

        state: {
            type: DataTypes.STRING(20),
            allowNull: false
        },

        pincode: {
            type: DataTypes.STRING(10),
            allowNull: false
        },

        country: {
            type: DataTypes.STRING(40),
            allowNull: false,
            defaultValue: "India"
        }
    },
    {
        tableName: "user_addresses",
        timestamps: false
    }
);

module.exports = UserAddress;