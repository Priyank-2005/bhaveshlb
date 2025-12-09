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

// ------------------------------------------------------------------
// 🔥 CRITICAL FIX: Define allowed origins for production and development
const allowedOrigins = [
    'https://bhaveshlb.vercel.app', // <-- YOUR PRODUCTION FRONTEND URL (Vercel)
    'http://localhost:3000',        // <-- LOCAL DEVELOPMENT FRONTEND
];

const corsOptions = {
    // Check if the requesting origin is in the allowed list
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // IMPORTANT: Allows cookies/authorization headers
};

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // To parse JSON requests
app.use(express.urlencoded({ extended: true })); // To parse form data

// 🔥 CRITICAL FIX: Apply the dynamic CORS options
app.use(cors(corsOptions)); 
// ------------------------------------------------------------------


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/masters', mastersRoutes);
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