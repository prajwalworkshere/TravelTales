
const express = require("express");

const router = express.Router();

const {
    getPublishedBlogs,
    getBlogById,
    createBlog,
    getMyBlogs,
    getBlogForEdit,
    updateBlog,
    deleteMyBlog
} = require("../controllers/blogController");

const upload = require("../middleware/upload");

const { authenticateToken } = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC BLOG ROUTES
// ==========================================

// Get all published blogs
router.get("/", getPublishedBlogs);

// ==========================================
// AUTHENTICATED USER BLOG ROUTES
// ==========================================

// Get all blogs created by the logged-in user
// Keep this BEFORE "/:id".
router.get("/user", authenticateToken, getMyBlogs);

// Get one of the logged-in user's blogs for editing
router.get("/edit/:id", authenticateToken, getBlogForEdit);

// Create a new blog
router.post(
    "/",
    authenticateToken,
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "additionalImages", maxCount: 5 }
    ]),
    createBlog
);

// Update an existing blog
router.put(
    "/:id",
    authenticateToken,
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "additionalImages", maxCount: 5 }
    ]),
    updateBlog
);

// Delete a blog owned by the logged-in user
router.delete("/:id", authenticateToken, deleteMyBlog);

// ==========================================
// PUBLIC BLOG DETAIL ROUTE
// Keep this AFTER specific GET routes.
// ==========================================

router.get("/:id", getBlogById);

module.exports = router;
