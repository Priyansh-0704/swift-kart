const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");

const errorHandler = require("./middleware/errorMiddleware");
const notFound = require("./middleware/notFoundMiddleware");

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
  })
);

app.use(express.json());

app.use("/api/v1/auth", authRoutes);

app.use(notFound)
app.use(errorHandler);

module.exports = app;