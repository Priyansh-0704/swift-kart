const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const addressRoutes = require("./routes/addressRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");

const errorHandler = require("./middleware/errorMiddleware");
const notFound = require("./middleware/notFoundMiddleware");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
  })
);

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { status: "error", message: "Too many requests. Please try again later." }
});

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/checkout", checkoutRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/admin/orders", adminOrderRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;