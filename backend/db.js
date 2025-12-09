// db.js

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create the connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection when the application starts
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to MySQL Database!');
        connection.release();
    })
    .catch(err => {
        console.error('Database Connection Failed:', err.stack);
    });


module.exports = pool;