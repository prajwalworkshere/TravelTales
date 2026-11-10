const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');


// ==========================================
// Authentication Middleware
// Verify JWT and identify logged-in user
// ==========================================

const authenticateToken = async (req, res, next) => {

    try {

        // 1. Get Authorization header

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {

            return res.status(401).json({
                success: false,
                message: 'Authentication token is required.'
            });

        }


        // 2. Extract token

        const token = authHeader.split(' ')[1];


        // 3. Verify JWT

        let decoded;

        try {

            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET,
                {
                    issuer: 'traveltales-api'
                }
            );

        } catch (error) {

            if (error.name === 'TokenExpiredError') {

                return res.status(401).json({
                    success: false,
                    message: 'Authentication token has expired. Please log in again.'
                });

            }

            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token.'
            });

        }


        // 4. Fetch current user from database

        const sql = `
            SELECT
                user_id,
                full_name,
                email,
                role,
                account_status
            FROM users
            WHERE user_id = ?
        `;

        const [users] = await pool.execute(
            sql,
            [decoded.sub]
        );


        // 5. Check whether user still exists

        if (users.length === 0) {

            return res.status(401).json({
                success: false,
                message: 'User account not found.'
            });

        }

        const user = users[0];


        // 6. Check account status

        if (user.account_status !== 'ACTIVE') {

            return res.status(403).json({
                success: false,
                message: 'Your account is inactive.'
            });

        }


        // 7. Attach authenticated user to request

        req.user = {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        };


        // 8. Continue to next middleware/controller

        next();

    } catch (error) {

        console.error('Authentication error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.'
        });

    }

};


// ==========================================
// Authorization Middleware
// Allow only ADMIN users
// ==========================================

const authorizeAdmin = (req, res, next) => {

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: 'Authentication is required.'
        });

    }

    if (req.user.role !== 'ADMIN') {

        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });

    }

    next();

};


module.exports = {
    authenticateToken,
    authorizeAdmin
};