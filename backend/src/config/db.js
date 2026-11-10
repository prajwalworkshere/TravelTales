const mysql = require("mysql2/promise");

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Function to test database connection
const testConnection = async () => {
    let connection;

    try {
        connection = await pool.getConnection();

        console.log("MySQL Database Connected Successfully!");
        console.log(`Database: ${process.env.DB_NAME}`);

    } catch (error) {
        console.error("MySQL Database Connection Failed!");
        console.error(error.message);

        throw error;

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Export pool and connection test function
module.exports = {
    pool,
    testConnection
};