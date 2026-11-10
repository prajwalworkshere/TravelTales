const express = require("express");

const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  getMyProfile,
  updateMyProfile,
  deleteUser,
  updateUserRole,
} = require("../controllers/userController");

const {
  authenticateToken,
  authorizeAdmin,
} = require("../middleware/authMiddleware");

// ==========================================
// NORMAL USER PROFILE ROUTES
// These must come BEFORE "/:id".
// ==========================================

router.get(
  "/profile",
  authenticateToken,
  getMyProfile
);

router.put(
  "/profile",
  authenticateToken,
  updateMyProfile
);

// ==========================================
// ADMIN USER MANAGEMENT ROUTES
// ==========================================

// Get all users.
router.get(
  "/",
  authenticateToken,
  authorizeAdmin,
  getAllUsers
);

// Get a specific user.
router.get(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  getUserById
);

// Update a specific user's profile information.
router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  updateUser
);

// Promote USER to ADMIN or demote ADMIN to USER.
router.patch(
  "/:id/role",
  authenticateToken,
  authorizeAdmin,
  updateUserRole
);

// Update user account status.
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeAdmin,
  updateUserStatus
);

// Delete a specific user.
router.delete(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  deleteUser
);

module.exports = router;