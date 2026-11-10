
const { pool } = require('../config/db');

// ==========================================
// API 1: GET ALL BLOGS (ADMIN)
// ==========================================

const getAllBlogs = async (req, res) => {
    try {
        const { status, search } = req.query;

        // Pagination
        const page = req.query.page === undefined
            ? 1
            : Number(req.query.page);

        const limit = req.query.limit === undefined
            ? 10
            : Number(req.query.limit);

        if (
            !Number.isSafeInteger(page) ||
            !Number.isSafeInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 50 ||
            !Number.isSafeInteger((page - 1) * limit)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters.'
            });
        }

        // Validate status
        const allowedStatuses = [
            'DRAFT',
            'PUBLISHED',
            'HIDDEN'
        ];

        if (
            status !== undefined &&
            (
                typeof status !== 'string' ||
                !allowedStatuses.includes(status)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Status must be DRAFT, PUBLISHED or HIDDEN.'
            });
        }

        // Validate search
        if (
            search !== undefined &&
            (
                typeof search !== 'string' ||
                search.trim().length > 100
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Search must be a string of at most 100 characters.'
            });
        }

        // Build dynamic WHERE conditions
        let whereClause = 'WHERE 1 = 1';
        const queryParams = [];

        if (status) {
            whereClause += ' AND b.status = ?';
            queryParams.push(status);
        }

        // Search title, author and destination
        if (search && search.trim()) {
            whereClause += `
                AND (
                    b.title LIKE ?
                    OR u.full_name LIKE ?
                    OR d.destination_name LIKE ?
                )
            `;

            const searchValue = `%${search.trim()}%`;

            queryParams.push(
                searchValue,
                searchValue,
                searchValue
            );
        }

        const offset = (page - 1) * limit;

        // Retrieve blogs
        const blogsSql = `
            SELECT
                b.blog_id,
                b.title,
                b.cover_image,
                b.status,
                b.views,
                b.travel_date,
                b.published_at,
                b.created_at,
                b.updated_at,

                u.user_id,
                u.full_name AS author_name,

                d.destination_id,
                d.destination_name

            FROM blogs AS b

            INNER JOIN users AS u
                ON b.user_id = u.user_id

            INNER JOIN destinations AS d
                ON b.destination_id = d.destination_id

            ${whereClause}

            ORDER BY b.created_at DESC

            LIMIT ? OFFSET ?
        `;

        const [blogs] = await pool.execute(
            blogsSql,
            [...queryParams, limit, offset]
        );

        // Retrieve total matching blogs
        const countSql = `
            SELECT COUNT(*) AS total
            FROM blogs AS b

            INNER JOIN users AS u
                ON b.user_id = u.user_id

            INNER JOIN destinations AS d
                ON b.destination_id = d.destination_id

            ${whereClause}
        `;

        const [countResult] = await pool.execute(
            countSql,
            queryParams
        );

        const totalBlogs = Number(countResult[0].total);
        const totalPages = Math.ceil(totalBlogs / limit);

        return res.status(200).json({
            success: true,
            message: 'Blogs retrieved successfully.',
            data: blogs,
            pagination: {
                currentPage: page,
                limit,
                totalBlogs,
                totalPages
            }
        });

    } catch (error) {
        console.error('Get all admin blogs error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve blogs.'
        });
    }
};


// ==========================================
// API 2: GET SINGLE BLOG BY ID (ADMIN)
// ==========================================

const getBlogById = async (req, res) => {
    try {
        const blogId = Number(req.params.id);

        if (
            !Number.isSafeInteger(blogId) ||
            blogId <= 0 ||
            blogId > 4294967295
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid blog ID.'
            });
        }

        const blogSql = `
            SELECT
                b.blog_id,
                b.title,
                b.story,
                b.travel_date,
                b.travel_tips,
                b.cover_image,
                b.status,
                b.views,
                b.published_at,
                b.created_at,
                b.updated_at,

                u.user_id,
                u.full_name AS author_name,
                u.email AS author_email,

                d.destination_id,
                d.destination_name,
                d.city,
                d.state_region,
                d.country

            FROM blogs AS b

            INNER JOIN users AS u
                ON b.user_id = u.user_id

            INNER JOIN destinations AS d
                ON b.destination_id = d.destination_id

            WHERE b.blog_id = ?
        `;

        const [blogs] = await pool.execute(
            blogSql,
            [blogId]
        );

        if (blogs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found.'
            });
        }

        const imagesSql = `
            SELECT
                image_id,
                image_path,
                image_caption,
                display_order,
                created_at

            FROM blog_images

            WHERE blog_id = ?

            ORDER BY display_order ASC, image_id ASC
        `;

        const [images] = await pool.execute(
            imagesSql,
            [blogId]
        );

        const blog = {
            ...blogs[0],
            images
        };

        return res.status(200).json({
            success: true,
            message: 'Blog retrieved successfully.',
            data: blog
        });

    } catch (error) {
        console.error('Get admin blog by ID error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve blog.'
        });
    }
};


// ==========================================
// API 3: PUBLISH / HIDE BLOG (ADMIN)
// ==========================================

const updateBlogStatus = async (req, res) => {
    try {
        const blogId = Number(req.params.id);

        if (
            !Number.isSafeInteger(blogId) ||
            blogId <= 0 ||
            blogId > 4294967295
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid blog ID.'
            });
        }

        if (
            !req.body ||
            typeof req.body !== 'object' ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request body.'
            });
        }

        const receivedFields = Object.keys(req.body);

        const hasInvalidFields = receivedFields.some(
            field => field !== 'status'
        );

        if (
            hasInvalidFields ||
            !Object.prototype.hasOwnProperty.call(req.body, 'status')
        ) {
            return res.status(400).json({
                success: false,
                message: 'Request must contain only the status field.'
            });
        }

        const { status } = req.body;

        const allowedStatuses = [
            'PUBLISHED',
            'HIDDEN'
        ];

        if (
            typeof status !== 'string' ||
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Status must be PUBLISHED or HIDDEN.'
            });
        }

        const checkSql = `
            SELECT blog_id
            FROM blogs
            WHERE blog_id = ?
        `;

        const [existingBlogs] = await pool.execute(
            checkSql,
            [blogId]
        );

        if (existingBlogs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found.'
            });
        }

        const updateSql = `
            UPDATE blogs
            SET
                status = ?,
                published_at = CASE
                    WHEN ? = 'PUBLISHED'
                    THEN COALESCE(
                        published_at,
                        CURRENT_TIMESTAMP
                    )
                    ELSE published_at
                END
            WHERE blog_id = ?
        `;

        await pool.execute(
            updateSql,
            [status, status, blogId]
        );

        const selectSql = `
            SELECT
                blog_id,
                title,
                status,
                published_at,
                updated_at
            FROM blogs
            WHERE blog_id = ?
        `;

        const [updatedBlogs] = await pool.execute(
            selectSql,
            [blogId]
        );

        return res.status(200).json({
            success: true,
            message: `Blog status updated to ${status} successfully.`,
            data: updatedBlogs[0]
        });

    } catch (error) {
        console.error('Update admin blog status error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update blog status.'
        });
    }
};


// ==========================================
// API 4: DELETE BLOG (ADMIN)
// ==========================================

const deleteBlog = async (req, res) => {
    try {
        const blogId = Number(req.params.id);

        if (
            !Number.isSafeInteger(blogId) ||
            blogId <= 0 ||
            blogId > 4294967295
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid blog ID.'
            });
        }

        const deleteSql = `
            DELETE FROM blogs
            WHERE blog_id = ?
        `;

        const [result] = await pool.execute(
            deleteSql,
            [blogId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Blog deleted successfully.',
            data: {
                blog_id: blogId
            }
        });

    } catch (error) {
        console.error('Delete admin blog error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to delete blog.'
        });
    }
};


// ==========================================
// EXPORT ALL CONTROLLERS
// ==========================================

module.exports = {
    getAllBlogs,
    getBlogById,
    updateBlogStatus,
    deleteBlog
};
