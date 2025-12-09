// backend/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // The MySQL pool
const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' }); // Token expires in 30 days
};

//-------------------------------------------------------------
/**
 * 1. SIGNUP: Register a new user
 * Method: POST /api/auth/signup
 */
exports.signup = async (req, res) => {
    // 1. UPDATED: Removed contact_no from request body
    const { username, password, name } = req.body; 
    
    // 1. UPDATED: Removed contact_no from validation check
    if (!username || !password || !name) {
        return res.status(400).json({ message: 'Please enter username, password, and name.' });
    }

    try {
        // 2. UPDATED: Check if user already exists based only on username
        const [existingUsers] = await db.execute(
            'SELECT user_id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User with this username already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. UPDATED: Insert new user without contact_no
        const [result] = await db.execute(
            'INSERT INTO users (username, password_hash, name) VALUES (?, ?, ?)',
            [username, password_hash, name]
        );

        const user_id = result.insertId;

        res.status(201).json({ 
            message: 'User registered successfully.',
            token: generateToken(user_id),
            user_id
        });

    } catch (error) {
        console.error('--- CRITICAL SIGNUP ERROR LOG ---');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Stack Trace:', error.stack);
        console.error('-----------------------------------');
        
        res.status(500).json({ message: 'Internal Server Error during registration. Check backend console for details.' });
    }
};
//-------------------------------------------------------------

/**
 * 2. LOGIN: Authenticate user
 * Method: POST /api/auth/login
 */
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const [users] = await db.execute(
            // NOTE: Added 'name' to SELECT list to be useful on the frontend
            'SELECT user_id, username, password_hash, name FROM users WHERE username = ?',
            [username]
        );

        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Successful login
        res.json({
            message: 'Login successful.',
            token: generateToken(user.user_id),
            user_id: user.user_id,
            username: user.username, 
            name: user.name,
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};
//-------------------------------------------------------------

/**
 * 3. FORGOT PASSWORD (OTP): Placeholder functions
 */
exports.sendOtp = (req, res) => {
    res.status(501).json({ message: 'OTP sending functionality is not yet implemented (requires Twilio setup).' });
};

exports.verifyOtpAndResetPassword = (req, res) => {
    res.status(501).json({ message: 'OTP verification and reset functionality is not yet implemented.' });
};