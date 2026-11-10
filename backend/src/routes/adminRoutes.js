
const express = require("express");

const router = express.Router();

// ==========================================
// IMPORT ADMIN DASHBOARD CONTROLLER
// ==========================================

const {
    getAdminDashboard
} = require("../controllers/adminDashboardController");

// ==========================================
// IMPORT ADMIN BLOG CONTROLLERS
// ==========================================

const {
    getAllBlogs,
    getBlogById,
    updateBlogStatus,
    deleteBlog
} = require("../controllers/adminBlogController");

// ==========================================
// IMPORT CONTACT MESSAGE CONTROLLERS
// ==========================================

const {
    getAllContactMessages,
    getContactMessageStats,
    getContactMessageById,
    updateContactMessageStatus
} = require("../controllers/contactController");

// ==========================================
// AUTHENTICATION AND AUTHORIZATION
// ==========================================

const {
    authenticateToken,
    authorizeAdmin
} = require("../middleware/authMiddleware");

// ==========================================
// ADMIN ACCESS CHECK
// ==========================================

router.get(
    "/access-check",
    authenticateToken,
    authorizeAdmin,
    (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Admin access granted successfully!",
            data: {
                user_id: req.user.user_id,
                full_name: req.user.full_name,
                email: req.user.email,
                role: req.user.role
            }
        });
    }
);

// ==========================================
// ADMIN DASHBOARD API
// ==========================================

router.get(
    "/dashboard",
    authenticateToken,
    authorizeAdmin,
    getAdminDashboard
);

// ==========================================
// ADMIN BLOG MANAGEMENT APIs
// ==========================================

router.get(
    "/blogs",
    authenticateToken,
    authorizeAdmin,
    getAllBlogs
);

router.get(
    "/blogs/:id",
    authenticateToken,
    authorizeAdmin,
    getBlogById
);

router.patch(
    "/blogs/:id/status",
    authenticateToken,
    authorizeAdmin,
    updateBlogStatus
);

router.delete(
    "/blogs/:id",
    authenticateToken,
    authorizeAdmin,
    deleteBlog
);

// ==========================================
// ADMIN CONTACT MESSAGE APIs
// ==========================================

router.get(
    "/contact-messages",
    authenticateToken,
    authorizeAdmin,
    getAllContactMessages
);

router.get(
    "/contact-messages/stats",
    authenticateToken,
    authorizeAdmin,
    getContactMessageStats
);

router.get(
    "/contact-messages/:id",
    authenticateToken,
    authorizeAdmin,
    getContactMessageById
);

router.patch(
    "/contact-messages/:id/status",
    authenticateToken,
    authorizeAdmin,
    updateContactMessageStatus
);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
