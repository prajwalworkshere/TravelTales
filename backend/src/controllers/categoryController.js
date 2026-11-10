const { pool } = require('../config/db');

// GET /api/categories
const getAllCategories = async (req, res) => {
    try {
        const sql = `
            SELECT
                category_id,
                category_name,
                description,
                status,
                created_at,
                updated_at
            FROM categories
        `;

        const [categories] = await pool.execute(sql);

        return res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });

    } catch (error) {
        console.error('Error fetching categories:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching categories.'
        });
    }
};


// GET /api/categories/:id
const getCategoryById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID.'
            });
        }

        const sql = `
            SELECT
                category_id,
                category_name,
                description,
                status,
                created_at,
                updated_at
            FROM categories
            WHERE category_id = ?
        `;

        const [categories] = await pool.execute(sql, [id]);

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: categories[0]
        });

    } catch (error) {
        console.error('Error fetching category:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching category.'
        });
    }
};


// Export both functions
module.exports = {
    getAllCategories,
    getCategoryById
};