
const { pool } = require("../config/db");
const fs = require("fs");
const path = require("path");

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Remove newly uploaded files if an operation fails.
const cleanupUploadedFiles = (files) => {
    if (!files) return;

    const allFiles = Object.values(files).flat();

    allFiles.forEach((file) => {
        if (file && file.path) {
            fs.unlink(file.path, (error) => {
                if (error && error.code !== "ENOENT") {
                    console.error("Uploaded file cleanup failed:", error.message);
                }
            });
        }
    });
};

// Delete stored image files using their database paths.
const deleteStoredFiles = (imagePaths) => {
    if (!Array.isArray(imagePaths)) return;

    const uploadDirectory = path.join(__dirname, "../../uploads");

    imagePaths
        .filter(Boolean)
        .forEach((imagePath) => {
            const filename = path.basename(imagePath);
            const fullPath = path.join(uploadDirectory, filename);

            fs.unlink(fullPath, (error) => {
                if (error && error.code !== "ENOENT") {
                    console.error("Stored image cleanup failed:", error.message);
                }
            });
        });
};

// Convert a Multer file into the public URL stored in the database.
const getImagePath = (file) => {
    return file ? `/uploads/${file.filename}` : null;
};

// Validate a positive integer ID.
const isValidId = (id) => {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
};

// Validate required blog fields.
const validateBlogFields = (body) => {
    const {
        title,
        story,
        category_id,
        destination_id,
        customDestination,
        customCountry
    } = body;

    if (!title || !title.trim()) {
        return "Blog title is required.";
    }

    if (!story || !story.trim()) {
        return "Blog story is required.";
    }

    if (!category_id || !isValidId(category_id)) {
        return "A valid category is required.";
    }

    if (
        (!destination_id || !isValidId(destination_id)) &&
        (!customDestination || !customDestination.trim() ||
            !customCountry || !customCountry.trim())
    ) {
        return "Select a destination or provide a custom destination and country.";
    }

    if (body.travel_date && !isValidDate(body.travel_date)) {
        return "Travel date must be a valid date in YYYY-MM-DD format.";
    }

    return null;
};

// Validate an actual calendar date, not just its format.
const isValidDate = (dateValue) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return false;
    }

    const date = new Date(`${dateValue}T00:00:00Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === dateValue
    );
};

// Resolve an existing or custom destination.
const resolveDestination = async (connection, body) => {
    const { destination_id, customDestination, customCountry } = body;

    if (destination_id && isValidId(destination_id)) {
        const [destinations] = await connection.query(
            `SELECT destination_id
             FROM destinations
             WHERE destination_id = ?
               AND status = 'ACTIVE'
             LIMIT 1`,
            [Number(destination_id)]
        );

        if (destinations.length === 0) {
            throw new Error("Selected destination does not exist or is inactive.");
        }

        return destinations[0].destination_id;
    }

    if (!customDestination || !customDestination.trim() ||
        !customCountry || !customCountry.trim()) {
        throw new Error("Custom destination name and country are required.");
    }

    const destinationName = customDestination.trim();
    const country = customCountry.trim();

    const [existingDestinations] = await connection.query(
        `SELECT destination_id
         FROM destinations
         WHERE LOWER(destination_name) = LOWER(?)
           AND LOWER(country) = LOWER(?)
           AND status = 'ACTIVE'
         LIMIT 1`,
        [destinationName, country]
    );

    if (existingDestinations.length > 0) {
        return existingDestinations[0].destination_id;
    }

    const [result] = await connection.query(
        `INSERT INTO destinations
            (destination_name, country, status)
         VALUES (?, ?, 'ACTIVE')`,
        [destinationName, country]
    );

    return result.insertId;
};

// Validate that the selected category is active.
const validateCategory = async (connection, categoryId) => {
    const [categories] = await connection.query(
        `SELECT category_id
         FROM categories
         WHERE category_id = ?
           AND status = 'ACTIVE'
         LIMIT 1`,
        [Number(categoryId)]
    );

    if (categories.length === 0) {
        throw new Error("Selected category does not exist or is inactive.");
    }

    return categories[0].category_id;
};

// Insert additional blog images.
const insertAdditionalImages = async (
    connection,
    blogId,
    imageFiles,
    startingOrder = 0
) => {
    if (!imageFiles || imageFiles.length === 0) return;

    for (let index = 0; index < imageFiles.length; index++) {
        const imagePath = getImagePath(imageFiles[index]);

        await connection.query(
            `INSERT INTO blog_images
                (blog_id, image_path, display_order)
             VALUES (?, ?, ?)`,
            [blogId, imagePath, startingOrder + index]
        );
    }
};

// Fetch images belonging to a blog.
const getBlogImages = async (connection, blogId) => {
    const [images] = await connection.query(
        `SELECT image_id, image_path, image_caption, display_order
         FROM blog_images
         WHERE blog_id = ?
         ORDER BY display_order ASC, image_id ASC`,
        [blogId]
    );

    return images;
};

// ==========================================
// 1. GET ALL PUBLISHED BLOGS
// GET /api/blogs
// ==========================================

const getPublishedBlogs = async (req, res) => {
    try {
        const [blogs] = await pool.query(
            `SELECT
                b.blog_id,
                b.title,
                b.story,
                b.travel_date,
                b.travel_tips,
                b.cover_image,
                b.views,
                b.published_at,
                b.created_at,

                u.user_id,
                u.full_name AS author_name,
                u.profile_image AS author_image,

                d.destination_id,
                d.destination_name,
                d.country,

                c.category_id,
                c.category_name

             FROM blogs b

             INNER JOIN users u
                ON b.user_id = u.user_id

             INNER JOIN destinations d
                ON b.destination_id = d.destination_id

             INNER JOIN categories c
                ON b.category_id = c.category_id

             WHERE b.status = 'PUBLISHED'
               AND u.account_status = 'ACTIVE'
               AND d.status = 'ACTIVE'
               AND c.status = 'ACTIVE'

             ORDER BY b.published_at DESC, b.created_at DESC`
        );

        res.status(200).json({
            success: true,
            count: blogs.length,
            data: blogs
        });

    } catch (error) {
        console.error("Get published blogs error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch published blogs."
        });
    }
};

// ==========================================
// 2. GET SINGLE PUBLISHED BLOG
// GET /api/blogs/:id
// ==========================================

const getBlogById = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid blog ID."
        });
    }

    try {
        const [result] = await pool.query(
            `UPDATE blogs
             SET views = views + 1
             WHERE blog_id = ?
               AND status = 'PUBLISHED'`,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Published blog not found."
            });
        }

        const [blogs] = await pool.query(
            `SELECT
                b.*,

                u.full_name AS author_name,
                u.profile_image AS author_image,
                u.bio AS author_bio,

                d.destination_name,
                d.city,
                d.state_region,
                d.country,

                c.category_name

             FROM blogs b

             INNER JOIN users u
                ON b.user_id = u.user_id

             INNER JOIN destinations d
                ON b.destination_id = d.destination_id

             INNER JOIN categories c
                ON b.category_id = c.category_id

             WHERE b.blog_id = ?
               AND b.status = 'PUBLISHED'
               AND u.account_status = 'ACTIVE'
               AND d.status = 'ACTIVE'
               AND c.status = 'ACTIVE'
             LIMIT 1`,
            [Number(id)]
        );

        if (blogs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Published blog not found."
            });
        }

        const images = await getBlogImages(pool, Number(id));

        res.status(200).json({
            success: true,
            data: {
                ...blogs[0],
                images
            }
        });

    } catch (error) {
        console.error("Get blog details error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch blog details."
        });
    }
};

// ==========================================
// 3. CREATE BLOG
// POST /api/blogs
// ==========================================

const createBlog = async (req, res) => {
    const userId = req.user.user_id;
    const files = req.files || {};

    const coverFile = files.coverImage?.[0];
    const additionalFiles = files.additionalImages || [];

    const validationError = validateBlogFields(req.body);

    if (validationError) {
        cleanupUploadedFiles(files);

        return res.status(400).json({
            success: false,
            message: validationError
        });
    }

    if (!coverFile) {
        cleanupUploadedFiles(files);

        return res.status(400).json({
            success: false,
            message: "A cover image is required."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        const categoryId = await validateCategory(
            connection,
            req.body.category_id
        );

        const destinationId = await resolveDestination(
            connection,
            req.body
        );

        const {
            title,
            story,
            travel_date,
            travel_tips
        } = req.body;

        const coverImagePath = getImagePath(coverFile);

        const [result] = await connection.query(
            `INSERT INTO blogs
                (
                    user_id,
                    destination_id,
                    category_id,
                    title,
                    story,
                    travel_date,
                    travel_tips,
                    cover_image,
                    status,
                    published_at
                )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', NULL)`,
            [
                userId,
                destinationId,
                categoryId,
                title.trim(),
                story.trim(),
                travel_date || null,
                travel_tips?.trim() || null,
                coverImagePath
            ]
        );

        const blogId = result.insertId;

        await insertAdditionalImages(
            connection,
            blogId,
            additionalFiles
        );

        await connection.commit();
        transactionStarted = false;

        res.status(201).json({
            success: true,
            message: "Blog created successfully and submitted as a draft for admin review.",
            data: {
                blog_id: blogId,
                status: "DRAFT"
            }
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        cleanupUploadedFiles(files);

        console.error("Create blog error:", error);

        const isClientError = [
            "Selected destination does not exist or is inactive.",
            "Custom destination name and country are required.",
            "Selected category does not exist or is inactive."
        ].includes(error.message);

        res.status(isClientError ? 400 : 500).json({
            success: false,
            message: isClientError
                ? error.message
                : "Failed to create blog."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ==========================================
// 4. GET LOGGED-IN USER'S BLOGS
// GET /api/blogs/user
// ==========================================

const getMyBlogs = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const [blogs] = await pool.query(
            `SELECT
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

                d.destination_name,
                d.country,

                c.category_name

             FROM blogs b

             INNER JOIN destinations d
                ON b.destination_id = d.destination_id

             INNER JOIN categories c
                ON b.category_id = c.category_id

             WHERE b.user_id = ?

             ORDER BY b.created_at DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            count: blogs.length,
            data: blogs
        });

    } catch (error) {
        console.error("Get user's blogs error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch your blogs."
        });
    }
};

// ==========================================
// 5. GET USER'S BLOG FOR EDITING
// GET /api/blogs/edit/:id
// ==========================================

const getBlogForEdit = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.user_id;

    if (!isValidId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid blog ID."
        });
    }

    try {
        const [blogs] = await pool.query(
            `SELECT *
             FROM blogs
             WHERE blog_id = ?
               AND user_id = ?
             LIMIT 1`,
            [Number(id), userId]
        );

        if (blogs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Blog not found or you do not have permission to edit it."
            });
        }

        const images = await getBlogImages(pool, Number(id));

        res.status(200).json({
            success: true,
            data: {
                ...blogs[0],
                images
            }
        });

    } catch (error) {
        console.error("Get blog for edit error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch blog for editing."
        });
    }
};

// ==========================================
// 6. UPDATE BLOG
// PUT /api/blogs/:id
// ==========================================

const updateBlog = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.user_id;
    const files = req.files || {};

    const coverFile = files.coverImage?.[0];
    const additionalFiles = files.additionalImages || [];

    if (!isValidId(id)) {
        cleanupUploadedFiles(files);

        return res.status(400).json({
            success: false,
            message: "Invalid blog ID."
        });
    }

    const validationError = validateBlogFields(req.body);

    if (validationError) {
        cleanupUploadedFiles(files);

        return res.status(400).json({
            success: false,
            message: validationError
        });
    }

    let connection;
    let transactionStarted = false;
    let oldCoverImage = null;

    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        const [existingBlogs] = await connection.query(
            `SELECT blog_id, cover_image
             FROM blogs
             WHERE blog_id = ?
               AND user_id = ?
             LIMIT 1`,
            [Number(id), userId]
        );

        if (existingBlogs.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            cleanupUploadedFiles(files);

            return res.status(404).json({
                success: false,
                message: "Blog not found or you do not have permission to edit it."
            });
        }

        oldCoverImage = existingBlogs[0].cover_image;

        const categoryId = await validateCategory(
            connection,
            req.body.category_id
        );

        const destinationId = await resolveDestination(
            connection,
            req.body
        );

        const {
            title,
            story,
            travel_date,
            travel_tips
        } = req.body;

        const newCoverImage = coverFile
            ? getImagePath(coverFile)
            : oldCoverImage;

        await connection.query(
            `UPDATE blogs
             SET
                destination_id = ?,
                category_id = ?,
                title = ?,
                story = ?,
                travel_date = ?,
                travel_tips = ?,
                cover_image = ?,
                status = 'DRAFT',
                published_at = NULL
             WHERE blog_id = ?
               AND user_id = ?`,
            [
                destinationId,
                categoryId,
                title.trim(),
                story.trim(),
                travel_date || null,
                travel_tips?.trim() || null,
                newCoverImage,
                Number(id),
                userId
            ]
        );

        const [imageRows] = await connection.query(
            `SELECT COALESCE(MAX(display_order), -1) AS last_order
             FROM blog_images
             WHERE blog_id = ?`,
            [Number(id)]
        );

        await insertAdditionalImages(
            connection,
            Number(id),
            additionalFiles,
            imageRows[0].last_order + 1
        );

        await connection.commit();
        transactionStarted = false;

        // Delete the old cover only after the database update succeeds.
        if (coverFile && oldCoverImage) {
            deleteStoredFiles([oldCoverImage]);
        }

        res.status(200).json({
            success: true,
            message: "Blog updated successfully and returned to draft status for admin review.",
            data: {
                blog_id: Number(id),
                status: "DRAFT"
            }
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        cleanupUploadedFiles(files);

        console.error("Update blog error:", error);

        const isClientError = [
            "Selected destination does not exist or is inactive.",
            "Custom destination name and country are required.",
            "Selected category does not exist or is inactive."
        ].includes(error.message);

        res.status(isClientError ? 400 : 500).json({
            success: false,
            message: isClientError
                ? error.message
                : "Failed to update blog."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ==========================================
// 7. DELETE USER'S BLOG
// DELETE /api/blogs/:id
// ==========================================

const deleteMyBlog = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.user_id;

    if (!isValidId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid blog ID."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        const [blogs] = await connection.query(
            `SELECT blog_id, cover_image
             FROM blogs
             WHERE blog_id = ?
               AND user_id = ?
             LIMIT 1`,
            [Number(id), userId]
        );

        if (blogs.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Blog not found or you do not have permission to delete it."
            });
        }

        const [images] = await connection.query(
            `SELECT image_path
             FROM blog_images
             WHERE blog_id = ?`,
            [Number(id)]
        );

        const imagePaths = [
            blogs[0].cover_image,
            ...images.map((image) => image.image_path)
        ];

        await connection.query(
            `DELETE FROM blogs
             WHERE blog_id = ?
               AND user_id = ?`,
            [Number(id), userId]
        );

        await connection.commit();
        transactionStarted = false;

        // The blog_images rows are deleted by the FK ON DELETE CASCADE.
        // Delete the corresponding physical files after the commit.
        deleteStoredFiles(imagePaths);

        res.status(200).json({
            success: true,
            message: "Blog deleted successfully."
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error("Delete blog error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete blog."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    getPublishedBlogs,
    getBlogById,
    createBlog,
    getMyBlogs,
    getBlogForEdit,
    updateBlog,
    deleteMyBlog
};
