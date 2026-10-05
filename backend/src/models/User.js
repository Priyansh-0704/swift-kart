const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    name: {
      type: DataTypes.STRING(25),
      allowNull: false
    },

    email: {
      type: DataTypes.STRING(100),
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

    status: {
      type: DataTypes.ENUM("Active", "Banned"),
      defaultValue: "Active",
      allowNull: false
    },

    banReason: {
      type: DataTypes.STRING(255),
      field: "ban_reason",
      allowNull: true
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

    tokenVersion: {
      type: DataTypes.INTEGER,
      field: "token_version",
      defaultValue: 0,
      allowNull: false
    },

    passwordResetCount: {
      type: DataTypes.INTEGER,
      field: "password_reset_count",
      defaultValue: 0,
      allowNull: false
    },

    passwordResetWindowStart: {
      type: DataTypes.DATE,
      field: "password_reset_window_start",
      allowNull: true
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

    emailOtpPurpose: {
      type: DataTypes.ENUM("register", "set_password"),
      field: "email_otp_purpose",
      allowNull: true
    }
  },
  {
    tableName: "users",
    timestamps: false
  }
);

User.beforeSave(async (user) => {
  if (user.changed("passwordHash") && user.passwordHash) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
  }
});

module.exports = User;