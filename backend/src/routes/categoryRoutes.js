const express = require('express');

const router = express.Router();

const {
    getAllCategories,
    getCategoryById
} = require('../controllers/categoryController');

// GET /api/categories
router.get('/', getAllCategories);

// GET /api/categories/:id
router.get('/:id', getCategoryById);

module.exports = router;