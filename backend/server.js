// server.js

const express = require('express');
const dotenv = require('dotenv');
const db = require('./db'); // Import the database connection pool
const authRoutes = require('./routes/authRoutes'); // We'll create this next
const mastersRoutes = require('./routes/mastersRoutes');
const inwardRoutes = require('./routes/inwardRoutes');
const outwardRoutes = require('./routes/outwardRoutes');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // To parse JSON requests
app.use(express.urlencoded({ extended: true })); // To parse form data

app.use(cors({
    origin: 'http://localhost:3000' 
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/masters', mastersRoutes); // <-- ADD THIS LINE (Prefix for master data)
app.use('/api/inward', inwardRoutes);
app.use('/api/outward', outwardRoutes);


// Simple test route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Logbook API is running successfully.' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});