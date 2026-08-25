const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(25),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    username: {
        type: DataTypes.STRING(25),
        allowNull: true,
        unique: true
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        field: "password_hash",
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM("Customer", "Admin"),
        defaultValue: "Customer",
        allowNull: false
    },
    authType: {
        type: DataTypes.ENUM("local", "google"),
        field: "auth_type",
        defaultValue: "local",
        allowNull: false
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        field: "is_verified",
        defaultValue: false,
        allowNull: false
    },
    googleId: {
        type: DataTypes.STRING(255),
        field: "google_id",
        allowNull: true,
        unique: true
    },
    emailOtpHash: {
        type: DataTypes.STRING(255),
        field: "email_otp_hash",
        allowNull: true
    },
    emailOtpExpiresAt: {
        type: DataTypes.DATE,
        field: "email_otp_expires_at",
        allowNull: true
    },
    emailOtpAttempts: {
        type: DataTypes.INTEGER,
        field: "email_otp_attempts",
        defaultValue: 0,
        allowNull: false
    },
    tokenVersion: {
        type: DataTypes.INTEGER,
        field: "token_version",
        defaultValue: 1,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM("Active", "Suspended"),
        defaultValue: "Active",
        allowNull: false
    }
}, {
    tableName: "users"
});

User.beforeSave(async (user) => {
    if (user.changed("passwordHash") && user.passwordHash) {
        const salt = await bcrypt.genSalt(12);
        user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
    }
});

module.exports = User;