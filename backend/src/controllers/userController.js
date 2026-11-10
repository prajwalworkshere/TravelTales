const { pool } = require("../config/db");

// ==========================================
// API 1: GET ALL USERS
// ==========================================

const getAllUsers = async (req, res) => {
  try {
    const sql = `
      SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.role,
        u.account_status,
        u.profile_image,
        u.bio,
        u.created_at,
        u.updated_at,
        COUNT(b.blog_id) AS blogs
      FROM users AS u
      LEFT JOIN blogs AS b
        ON u.user_id = b.user_id
      GROUP BY
        u.user_id,
        u.full_name,
        u.email,
        u.role,
        u.account_status,
        u.profile_image,
        u.bio,
        u.created_at,
        u.updated_at
      ORDER BY u.created_at DESC
    `;

    const [users] = await pool.execute(sql);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users.",
    });
  }
};

// ==========================================
// API 2: GET USER BY ID
// ==========================================

const getUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      userId > 4294967295
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const sql = `
      SELECT
        user_id,
        full_name,
        email,
        role,
        account_status,
        profile_image,
        bio,
        created_at,
        updated_at
      FROM users
      WHERE user_id = ?
    `;

    const [users] = await pool.execute(sql, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully.",
      data: users[0],
    });
  } catch (error) {
    console.error("Get user by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user.",
    });
  }
};

// ==========================================
// API 3: UPDATE USER
// Admin can update user profile information.
// ==========================================

const updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      userId > 4294967295
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body.",
      });
    }

    const allowedFields = [
      "full_name",
      "email",
      "bio",
      "profile_image",
    ];

    const receivedFields = Object.keys(req.body);

    const invalidFields = receivedFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Request contains fields that cannot be updated.",
      });
    }

    const {
      full_name,
      email,
      bio,
      profile_image,
    } = req.body;

    if (
      typeof full_name !== "string" ||
      typeof email !== "string" ||
      !Object.prototype.hasOwnProperty.call(req.body, "bio") ||
      !Object.prototype.hasOwnProperty.call(req.body, "profile_image")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, email, bio and profile image fields are required.",
      });
    }

    const cleanName = full_name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Full name must contain between 2 and 100 characters.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      cleanEmail.length > 150 ||
      !emailRegex.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (
      bio !== null &&
      (typeof bio !== "string" || bio.length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Bio must be a string or null and cannot exceed 500 characters.",
      });
    }

    if (
      profile_image !== null &&
      (
        typeof profile_image !== "string" ||
        profile_image.length > 500
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Profile image must be a string or null and cannot exceed 500 characters.",
      });
    }

    const [existingUsers] = await pool.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const [emailUsers] = await pool.execute(
      `
        SELECT user_id
        FROM users
        WHERE email = ?
          AND user_id != ?
      `,
      [cleanEmail, userId]
    );

    if (emailUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Email address is already registered with another user.",
      });
    }

    const sql = `
      UPDATE users
      SET
        full_name = ?,
        email = ?,
        bio = ?,
        profile_image = ?
      WHERE user_id = ?
    `;

    await pool.execute(sql, [
      cleanName,
      cleanEmail,
      bio,
      profile_image,
      userId,
    ]);

    const [updatedUsers] = await pool.execute(
      `
        SELECT
          user_id,
          full_name,
          email,
          role,
          account_status,
          profile_image,
          bio,
          created_at,
          updated_at
        FROM users
        WHERE user_id = ?
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: updatedUsers[0],
    });
  } catch (error) {
    console.error("Update user error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email address is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user.",
    });
  }
};

// ==========================================
// API 4: UPDATE USER ACCOUNT STATUS
// Admin can activate or deactivate users.
// ==========================================

const updateUserStatus = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      userId > 4294967295
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body.",
      });
    }

    const receivedFields = Object.keys(req.body);

    if (
      receivedFields.length !== 1 ||
      receivedFields[0] !== "account_status"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only account_status can be updated.",
      });
    }

    const { account_status } = req.body;

    if (
      typeof account_status !== "string" ||
      !["ACTIVE", "INACTIVE"].includes(account_status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Account status must be ACTIVE or INACTIVE.",
      });
    }

    if (
      Number(req.user.user_id) === userId &&
      account_status === "INACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account.",
      });
    }

    const [existingUsers] = await pool.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await pool.execute(
      `
        UPDATE users
        SET account_status = ?
        WHERE user_id = ?
      `,
      [account_status, userId]
    );

    const [updatedUsers] = await pool.execute(
      `
        SELECT
          user_id,
          full_name,
          email,
          role,
          account_status,
          updated_at
        FROM users
        WHERE user_id = ?
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "User account status updated successfully.",
      data: updatedUsers[0],
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user account status.",
    });
  }
};

// ==========================================
// API 5: GET LOGGED-IN USER PROFILE
// GET /api/users/profile
// ==========================================

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [users] = await pool.execute(
      `
        SELECT
          user_id,
          full_name,
          email,
          role,
          account_status,
          profile_image,
          bio,
          created_at,
          updated_at
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      data: users[0],
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your profile.",
    });
  }
};

// ==========================================
// API 6: UPDATE LOGGED-IN USER PROFILE
// PUT /api/users/profile
// ==========================================

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const {
      full_name,
      email,
      bio,
      profile_image,
    } = req.body;

    if (
      typeof full_name !== "string" ||
      typeof email !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Full name and email are required.",
      });
    }

    const cleanName = full_name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must contain between 2 and 100 characters.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(cleanEmail) ||
      cleanEmail.length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (
      bio !== undefined &&
      bio !== null &&
      (typeof bio !== "string" || bio.length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Bio must be text and cannot exceed 500 characters.",
      });
    }

    if (
      profile_image !== undefined &&
      profile_image !== null &&
      (
        typeof profile_image !== "string" ||
        profile_image.length > 500
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile image value.",
      });
    }

    const [emailUsers] = await pool.execute(
      `
        SELECT user_id
        FROM users
        WHERE email = ?
          AND user_id != ?
        LIMIT 1
      `,
      [cleanEmail, userId]
    );

    if (emailUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    await pool.execute(
      `
        UPDATE users
        SET
          full_name = ?,
          email = ?,
          bio = ?,
          profile_image = ?
        WHERE user_id = ?
      `,
      [
        cleanName,
        cleanEmail,
        bio?.trim() || null,
        profile_image?.trim() || null,
        userId,
      ]
    );

    const [updatedUsers] = await pool.execute(
      `
        SELECT
          user_id,
          full_name,
          email,
          role,
          account_status,
          profile_image,
          bio,
          created_at,
          updated_at
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUsers[0],
    });
  } catch (error) {
    console.error("Update my profile error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update your profile.",
    });
  }
};

// ==========================================
// API 7: DELETE USER
// DELETE /api/users/:id
// ADMIN ONLY
// ==========================================

const deleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      userId > 4294967295
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (Number(req.user.user_id) === userId) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const [users] = await pool.execute(
      `
        SELECT user_id, full_name, role
        FROM users
        WHERE user_id = ?
      `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = users[0];

    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be deleted.",
      });
    }

    const [blogCounts] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM blogs
        WHERE user_id = ?
      `,
      [userId]
    );

    const totalBlogs = Number(blogCounts[0].total);

    if (totalBlogs > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This user has authored blogs and cannot be deleted. Deactivate the account instead to preserve their content.",
        blogCount: totalBlogs,
      });
    }

    await pool.execute(
      "DELETE FROM users WHERE user_id = ?",
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: `${user.full_name}'s account was deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete user error:", error);

    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_NO_REFERENCED_ROW_2"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This user is connected to other records and cannot be deleted. Deactivate the account instead.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to delete user. Please try again.",
    });
  }
};

// ==========================================
// API 8: PROMOTE / DEMOTE USER ROLE
// PATCH /api/users/:id/role
// ADMIN ONLY
// ==========================================

const updateUserRole = async (req, res) => {
  const userId = Number(req.params.id);
  const { role } = req.body || {};

  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    userId > 4294967295
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID.",
    });
  }

  if (!["USER", "ADMIN"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be USER or ADMIN.",
    });
  }

  if (Number(req.user.user_id) === userId) {
    return res.status(403).json({
      success: false,
      message: "You cannot change your own role.",
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Lock the admin rows before checking the last-admin rule.
    const [adminRows] = await connection.execute(
      `
        SELECT user_id
        FROM users
        WHERE role = 'ADMIN'
        FOR UPDATE
      `
    );

    // Lock the target user's row.
    const [users] = await connection.execute(
      `
        SELECT user_id, full_name, email, role
        FROM users
        WHERE user_id = ?
        FOR UPDATE
      `,
      [userId]
    );

    if (users.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const targetUser = users[0];

    if (targetUser.role === role) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: `This user is already a ${role}.`,
      });
    }

    if (
      targetUser.role === "ADMIN" &&
      role === "USER" &&
      adminRows.length <= 1
    ) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "You cannot demote the last remaining admin.",
      });
    }

    await connection.execute(
      `
        UPDATE users
        SET role = ?
        WHERE user_id = ?
      `,
      [role, userId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        role === "ADMIN"
          ? `${targetUser.full_name} has been promoted to Admin.`
          : `${targetUser.full_name} has been demoted to User.`,
      data: {
        ...targetUser,
        role,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Update user role error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user role.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// ==========================================
// EXPORT CONTROLLER FUNCTIONS
// ==========================================

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  getMyProfile,
  updateMyProfile,
  deleteUser,
  updateUserRole,
};