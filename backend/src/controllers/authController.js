const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// ==========================================
// POST /api/auth/register
// Register a new normal user
// ==========================================

const register = async (req, res) => {

    try {

        const { full_name, email, password } = req.body;

        // 1. Validate required fields

        if (
            typeof full_name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {

            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required.'
            });

        }

        const name = full_name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (name.length < 2 || name.length > 100) {

            return res.status(400).json({
                success: false,
                message: 'Name must contain between 2 and 100 characters.'
            });

        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 150) {

            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });

        }

        if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {

            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 8 characters and must not exceed 72 bytes.'
            });

        }


        // 2. Check whether email already exists

        const checkSql = `
            SELECT user_id
            FROM users
            WHERE email = ?
        `;

        const [existingUsers] = await pool.execute(
            checkSql,
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {

            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });

        }


        // 3. Hash password using bcrypt

        const saltRounds = 12;

        const passwordHash = await bcrypt.hash(
            password,
            saltRounds
        );


        // 4. Insert new user into database

        const insertSql = `
            INSERT INTO users
                (full_name, email, password_hash, role, account_status)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(
            insertSql,
            [
                name,
                normalizedEmail,
                passwordHash,
                'USER',
                'ACTIVE'
            ]
        );


        // 5. Send response

        return res.status(201).json({
            success: true,
            message: 'Registration successful. Please log in.',
            data: {
                user_id: result.insertId,
                full_name: name,
                email: normalizedEmail,
                role: 'USER'
            }
        });

    } catch (error) {

        // Handle duplicate email constraint
        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });

        }

        console.error('Registration error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error during registration.'
        });

    }

};


// ==========================================
// POST /api/auth/login
// Authenticate user and generate JWT
// ==========================================

const login = async (req, res) => {

    try {

        const { email, password } = req.body;


        // 1. Validate input

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });

        }

        const normalizedEmail = email.trim().toLowerCase();


        // 2. Find user by email

        const sql = `
            SELECT
                user_id,
                full_name,
                email,
                password_hash,
                role,
                account_status
            FROM users
            WHERE email = ?
        `;

        const [users] = await pool.execute(
            sql,
            [normalizedEmail]
        );


        // 3. Check whether user exists

        if (users.length === 0) {

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });

        }

        const user = users[0];


        // 4. Check account status

        if (user.account_status !== 'ACTIVE') {

            return res.status(403).json({
                success: false,
                message: 'Your account is inactive. Please contact the administrator.'
            });

        }


        // 5. Compare password with stored hash

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordCorrect) {

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });

        }


        // 6. Generate JWT

        const token = jwt.sign(
            {
                sub: String(user.user_id)
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h',
                issuer: 'traveltales-api'
            }
        );


        // 7. Return token and user information

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            data: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error during login.'
        });

    }

};


// ==========================================
// GET /api/auth/me
// Get currently authenticated user
// ==========================================

const getCurrentUser = async (req, res) => {

    return res.status(200).json({
        success: true,
        data: req.user
    });

};


module.exports = {
    register,
    login,
    getCurrentUser
};