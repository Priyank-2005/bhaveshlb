// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const db = require('../db'); // The MySQL pool
const JWT_SECRET = process.env.JWT_SECRET;

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Fetch user from the database and attach to request
            const [users] = await db.execute(
                'SELECT user_id, username FROM users WHERE user_id = ?',
                [decoded.id]
            );

            if (users.length === 0) {
                return res.status(401).json({ message: 'Not authorized, user not found.' });
            }

            // Attach user ID to the request for logging/tracking
            req.user = users[0];
            next();

        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ message: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token.' });
    }
};