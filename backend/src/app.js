
const express = require("express");
const cors = require("cors");
const path = require("path");

const { pool } = require("./config/db");

// ==========================================
// IMPORT ROUTE FILES
// ==========================================

const categoryRoutes = require("./routes/categoryRoutes");
const destinationRoutes = require("./routes/destinationRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const blogRoutes = require("./routes/blogRoutes");

// ==========================================
// CREATE EXPRESS APPLICATION
// ==========================================

const app = express();

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173"
    })
);

app.use(express.json());

// Serve uploaded blog images.
app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"))
);

// ==========================================
// BACKEND HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "TravelTales Backend is running successfully!",
        server: "Express",
        status: "Healthy"
    });
});

// ==========================================
// DATABASE HEALTH CHECK
// ==========================================

app.get("/api/db-health", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT 1 AS database_status"
        );

        res.status(200).json({
            success: true,
            message: "MySQL Database is connected successfully!",
            database: process.env.DB_NAME,
            result: rows[0]
        });

    } catch (error) {
        console.error("Database health check failed:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection or query failed"
        });
    }
});

// ==========================================
// API ROUTES
// ==========================================

// Category APIs
app.use("/api/categories", categoryRoutes);

// Destination APIs
app.use("/api/destinations", destinationRoutes);

// Authentication APIs
app.use("/api/auth", authRoutes);

// Contact submission APIs
app.use("/api/contact", contactRoutes);

// Admin APIs
app.use("/api/admin", adminRoutes);

// User APIs
app.use("/api/users", userRoutes);

// Blog APIs
app.use("/api/blogs", blogRoutes);

// ==========================================
// INVALID ROUTE HANDLER
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});

// ==========================================
// EXPORT EXPRESS APPLICATION
// ==========================================

module.exports = app;
