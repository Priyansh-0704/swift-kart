require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const app = require("./app");
const sequelize = require("./config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully with PostgreSQL via Sequelize...");
    
    // await sequelize.sync({ force: true });
    app.listen(PORT, () => {
      console.log(`Server is running actively on port ${PORT}...`);
    });
  } catch (error) {
    console.error("Database connection failure occurred during startup:", error);
    process.exit(1);
  }
};

startServer();