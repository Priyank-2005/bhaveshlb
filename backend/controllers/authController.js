// controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // The MySQL pool
const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' }); // Token expires in 30 days
};

/**
 * 1. SIGNUP: Register a new user
 * Method: POST /api/auth/signup
 */
exports.signup = async (req, res) => {
    const { username, password, contact_no } = req.body;
    
    if (!username || !password || !contact_no) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    try {
        // Check if user already exists
        const [existingUsers] = await db.execute(
            'SELECT user_id FROM users WHERE username = ? OR contact_no = ?',
            [username, contact_no]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User with this username or contact number already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert new user into the database
        const [result] = await db.execute(
            'INSERT INTO users (username, password_hash, contact_no) VALUES (?, ?, ?)',
            [username, password_hash, contact_no]
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
        
        // Send a generic error message back to the frontend
        res.status(500).json({ message: 'Internal Server Error during registration. Check backend console for details.' });
    }
};

/**
 * 2. LOGIN: Authenticate user
 * Method: POST /api/auth/login
 */
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const [users] = await db.execute(
            'SELECT user_id, password_hash FROM users WHERE username = ?',
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
            username: user.username, // <-- ADD THIS LINE
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};


/**
 * 3. FORGOT PASSWORD (OTP): Placeholder functions
 */
exports.sendOtp = (req, res) => {
    // Logic to find user by contact_no and send OTP via Twilio
    // Requires Twilio setup and storing a temporary OTP/expiration time in the database
    res.status(501).json({ message: 'OTP sending functionality is not yet implemented (requires Twilio setup).' });
};

exports.verifyOtpAndResetPassword = (req, res) => {
    // Logic to verify the OTP and update the user's password_hash
    res.status(501).json({ message: 'OTP verification and reset functionality is not yet implemented.' });
};