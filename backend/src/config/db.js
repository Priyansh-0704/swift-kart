const {Pool} = require("pg") // to manage my psql connction to node app

const pool = new Pool(
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    }
);

pool.on("error", (error) =>
{
    console.error("PostgreSQL Error: ", error)
})

module.exports = pool;