const express = require('express');

const router = express.Router();

const {
    register,
    login,
    getCurrentUser
} = require('../controllers/authController');

const {
    authenticateToken
} = require('../middleware/authMiddleware');



// Public routes

router.post('/register', register);

router.post('/login', login);


// Protected route

router.get('/me', authenticateToken, getCurrentUser);


module.exports = router;