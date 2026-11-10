// Load environment variables
require("dotenv").config();

// Import Express application
const app = require("./src/app");

// Import database connection utilities
const { testConnection, pool } = require("./src/config/db");

// Define server port
const PORT = process.env.PORT || 5000;

// Start backend server
const startServer = async () => {

    try {

        // Verify MySQL connection before starting server
        await testConnection();

        // Start Express server
        const server = app.listen(PORT, () => {

            console.log("------------------------------------");
            console.log("       TRAVELTALES BACKEND");
            console.log("------------------------------------");

            console.log(`Server running on: http://localhost:${PORT}`);

            console.log(`Health API: http://localhost:${PORT}/api/health`);

            console.log(`Database API: http://localhost:${PORT}/api/db-health`);

            console.log("------------------------------------");

        });

        // Graceful shutdown
        const shutdown = async () => {

            console.log("\nShutting down TravelTales backend...");

            server.close(async () => {

                try {
                    await pool.end();

                    console.log("MySQL connection pool closed.");
                    process.exit(0);

                } catch (error) {
                    console.error("Error closing database pool:", error.message);
                    process.exit(1);
                }

            });

        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

    } catch (error) {

        console.error("Unable to start TravelTales backend.");
        console.error(error.message);

        await pool.end();

        process.exit(1);

    }

};

// Execute server startup
startServer();