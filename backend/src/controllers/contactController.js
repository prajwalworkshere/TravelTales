
const { pool } = require("../config/db");

// ==========================================
// HELPER: VALIDATE MESSAGE ID
// ==========================================

const isValidId = (id) => {
    const parsedId = Number(id);

    return (
        Number.isInteger(parsedId) &&
        parsedId > 0 &&
        parsedId <= 4294967295
    );
};

// ==========================================
// API 1: SUBMIT CONTACT MESSAGE
// POST /api/contact
// ==========================================

const submitContactMessage = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const { subject, message } = req.body;

        // Validate input
        if (
            typeof subject !== "string" ||
            typeof message !== "string" ||
            !subject.trim() ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Subject and message are required."
            });
        }

        const cleanSubject = subject.trim();
        const cleanMessage = message.trim();

        // Validate subject length
        if (cleanSubject.length > 200) {
            return res.status(400).json({
                success: false,
                message: "Subject cannot exceed 200 characters."
            });
        }

        // Validate message length
        if (cleanMessage.length > 65535) {
            return res.status(400).json({
                success: false,
                message: "Message is too long."
            });
        }

        // Insert contact message
        const [result] = await pool.query(
            `INSERT INTO contact_messages
                (user_id, subject, message)
             VALUES (?, ?, ?)`,
            [userId, cleanSubject, cleanMessage]
        );

        // Retrieve submitted message with sender details
        const [rows] = await pool.query(
            `SELECT
                cm.message_id,
                cm.subject,
                cm.message,
                cm.status,
                cm.created_at,
                u.full_name,
                u.email
             FROM contact_messages AS cm
             INNER JOIN users AS u
                ON cm.user_id = u.user_id
             WHERE cm.message_id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Contact message submitted successfully.",
            data: rows[0]
        });

    } catch (error) {
        console.error(
            "Submit contact message error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to submit contact message."
        });
    }
};

// ==========================================
// API 2: GET ALL CONTACT MESSAGES
// GET /api/admin/contact-messages
// ==========================================

const getAllContactMessages = async (req, res) => {
    try {
        const { search = "", status = "ALL" } = req.query;

        const allowedStatuses = [
            "ALL",
            "NEW",
            "READ",
            "RESOLVED"
        ];

        const normalizedStatus = String(status).toUpperCase();

        // Validate status filter
        if (!allowedStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status filter."
            });
        }

        // Base SQL query
        let sql = `
            SELECT
                cm.message_id,
                cm.subject,
                cm.message,
                cm.status,
                cm.created_at,
                cm.updated_at,
                u.full_name,
                u.email
            FROM contact_messages AS cm
            INNER JOIN users AS u
                ON cm.user_id = u.user_id
            WHERE 1 = 1
        `;

        const params = [];

        // Apply status filter
        if (normalizedStatus !== "ALL") {
            sql += " AND cm.status = ?";
            params.push(normalizedStatus);
        }

        // Apply search filter
        if (String(search).trim()) {
            const searchValue = `%${String(search).trim()}%`;

            sql += `
                AND (
                    u.full_name LIKE ?
                    OR u.email LIKE ?
                    OR cm.subject LIKE ?
                    OR cm.message LIKE ?
                )
            `;

            params.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }

        // Sort newest messages first
        sql += " ORDER BY cm.created_at DESC";

        const [messages] = await pool.query(sql, params);

        return res.status(200).json({
            success: true,
            message: "Contact messages retrieved successfully.",
            total: messages.length,
            data: messages
        });

    } catch (error) {
        console.error(
            "Get contact messages error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve contact messages."
        });
    }
};

// ==========================================
// API 3: GET CONTACT MESSAGE STATISTICS
// GET /api/admin/contact-messages/stats
// ==========================================

const getContactMessageStats = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                COUNT(*) AS total,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'NEW' THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS new,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'READ' THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS \`read\`,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'RESOLVED' THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS resolved

            FROM contact_messages
        `);

        const stats = rows[0];

        return res.status(200).json({
            success: true,
            message: "Contact message statistics retrieved successfully.",
            data: {
                total: Number(stats.total),
                new: Number(stats.new),
                read: Number(stats.read),
                resolved: Number(stats.resolved)
            }
        });

    } catch (error) {
        console.error(
            "Contact message statistics error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve contact message statistics."
        });
    }
};

// ==========================================
// API 4: GET CONTACT MESSAGE BY ID
// GET /api/admin/contact-messages/:id
// ==========================================

const getContactMessageById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate message ID
        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact message ID."
            });
        }

        // Retrieve message with sender details
        const [rows] = await pool.query(
            `SELECT
                cm.message_id,
                cm.subject,
                cm.message,
                cm.status,
                cm.created_at,
                cm.updated_at,
                u.user_id,
                u.full_name,
                u.email
             FROM contact_messages AS cm
             INNER JOIN users AS u
                ON cm.user_id = u.user_id
             WHERE cm.message_id = ?`,
            [Number(id)]
        );

        // Check whether message exists
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Contact message retrieved successfully.",
            data: rows[0]
        });

    } catch (error) {
        console.error(
            "Get contact message error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve contact message."
        });
    }
};

// ==========================================
// API 5: UPDATE CONTACT MESSAGE STATUS
// PATCH /api/admin/contact-messages/:id/status
// ==========================================

const updateContactMessageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate message ID
        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact message ID."
            });
        }

        // Validate status
        const allowedStatuses = [
            "NEW",
            "READ",
            "RESOLVED"
        ];

        if (
            typeof status !== "string" ||
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Status must be NEW, READ, or RESOLVED."
            });
        }

        // Check whether the message exists
        const [existingMessages] = await pool.query(
            `SELECT message_id
             FROM contact_messages
             WHERE message_id = ?`,
            [Number(id)]
        );

        if (existingMessages.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found."
            });
        }

        // Update message status
        await pool.query(
            `UPDATE contact_messages
             SET status = ?
             WHERE message_id = ?`,
            [status, Number(id)]
        );

        // Retrieve updated message
        const [rows] = await pool.query(
            `SELECT
                cm.message_id,
                cm.subject,
                cm.message,
                cm.status,
                cm.created_at,
                cm.updated_at,
                u.full_name,
                u.email
             FROM contact_messages AS cm
             INNER JOIN users AS u
                ON cm.user_id = u.user_id
             WHERE cm.message_id = ?`,
            [Number(id)]
        );

        return res.status(200).json({
            success: true,
            message: "Contact message status updated successfully.",
            data: rows[0]
        });

    } catch (error) {
        console.error(
            "Update contact message status error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update contact message status."
        });
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    submitContactMessage,
    getAllContactMessages,
    getContactMessageStats,
    getContactMessageById,
    updateContactMessageStatus
};
