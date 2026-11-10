
const express = require("express");

const router = express.Router();

const {
    submitContactMessage
} = require("../controllers/contactController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

// ==========================================
// API 1: SUBMIT CONTACT MESSAGE
// ==========================================

router.post(
    "/",
    authenticateToken,
    submitContactMessage
);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
