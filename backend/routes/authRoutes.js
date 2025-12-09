// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { signup, login, sendOtp, verifyOtpAndResetPassword } = require('../controllers/authController');

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/forgot-password/send-otp
router.post('/forgot-password/send-otp', sendOtp);

// POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', verifyOtpAndResetPassword);

module.exports = router;