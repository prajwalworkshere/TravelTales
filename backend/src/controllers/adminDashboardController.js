
const { pool } = require("../config/db");

// ==========================================
// API: GET ADMIN DASHBOARD DATA
// GET /api/admin/dashboard
// ==========================================

const getAdminDashboard = async (req, res) => {
    try {
        // Run dashboard statistics queries together.
        const [
            [userStats],
            [blogStats],
            [destinationStats],
            [contactStats],
            [recentBlogs]
        ] = await Promise.all([

            // 1. USER STATISTICS
            pool.execute(`
                SELECT
                    COUNT(*) AS totalUsers,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN created_at >= DATE_FORMAT(
                                    CURDATE(), '%Y-%m-01'
                                )
                                AND created_at < DATE_ADD(
                                    LAST_DAY(CURDATE()),
                                    INTERVAL 1 DAY
                                )
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS newUsersThisMonth,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN account_status = 'ACTIVE'
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS activeUsers
                FROM users
            `),

            // 2. BLOG STATISTICS
            pool.execute(`
                SELECT
                    COUNT(*) AS totalBlogs,
                    COALESCE(
                        SUM(status = 'DRAFT'), 0
                    ) AS draftBlogs,
                    COALESCE(
                        SUM(status = 'PUBLISHED'), 0
                    ) AS publishedBlogs,
                    COALESCE(
                        SUM(status = 'HIDDEN'), 0
                    ) AS hiddenBlogs
                FROM blogs
            `),

            // 3. DESTINATION STATISTICS
            pool.execute(`
                SELECT
                    COUNT(*) AS totalDestinations,
                    COALESCE(
                        SUM(status = 'ACTIVE'), 0
                    ) AS activeDestinations,
                    COUNT(DISTINCT country) AS totalCountries
                FROM destinations
            `),

            // 4. CONTACT MESSAGE STATISTICS
            pool.execute(`
                SELECT
                    COUNT(*) AS totalMessages,
                    COALESCE(
                        SUM(status = 'NEW'), 0
                    ) AS newMessages,
                    COALESCE(
                        SUM(status = 'READ'), 0
                    ) AS readMessages,
                    COALESCE(
                        SUM(status = 'RESOLVED'), 0
                    ) AS resolvedMessages
                FROM contact_messages
            `),

            // 5. FOUR MOST RECENT BLOGS
            pool.execute(`
                SELECT
                    b.blog_id,
                    b.title,
                    b.cover_image,
                    b.status,
                    b.views,
                    b.created_at,
                    u.full_name AS author_name,
                    d.destination_name,
                    d.city,
                    d.state_region,
                    d.country,
                    CONCAT_WS(
                        ', ',
                        d.city,
                        d.state_region,
                        d.country
                    ) AS destination
                FROM blogs AS b
                INNER JOIN users AS u
                    ON b.user_id = u.user_id
                INNER JOIN destinations AS d
                    ON b.destination_id = d.destination_id
                ORDER BY b.created_at DESC, b.blog_id DESC
                LIMIT 4
            `)
        ]);

        // Convert MySQL aggregate values into JavaScript numbers.
        const stats = {
            totalUsers: Number(userStats[0].totalUsers),
            newUsersThisMonth: Number(userStats[0].newUsersThisMonth),
            activeUsers: Number(userStats[0].activeUsers),

            totalBlogs: Number(blogStats[0].totalBlogs),
            draftBlogs: Number(blogStats[0].draftBlogs),
            publishedBlogs: Number(blogStats[0].publishedBlogs),
            hiddenBlogs: Number(blogStats[0].hiddenBlogs),

            totalDestinations: Number(destinationStats[0].totalDestinations),
            activeDestinations: Number(destinationStats[0].activeDestinations),
            totalCountries: Number(destinationStats[0].totalCountries),

            totalMessages: Number(contactStats[0].totalMessages),
            newMessages: Number(contactStats[0].newMessages),
            readMessages: Number(contactStats[0].readMessages),
            resolvedMessages: Number(contactStats[0].resolvedMessages)
        };

        return res.status(200).json({
            success: true,
            message: "Admin dashboard data retrieved successfully.",
            data: {
                stats,
                recentBlogs
            }
        });

    } catch (error) {
        console.error("Get admin dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve admin dashboard data."
        });
    }
};

module.exports = {
    getAdminDashboard
};
