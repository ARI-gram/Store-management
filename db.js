require('dotenv').config();
const { Pool } = require('pg');

// Initialize PostgreSQL connection pool with SSL enabled
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false, // Disable certificate validation (required for self-signed certs)
  },
});

// Test the connection
(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database.');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database:', err);
  }
})();

module.exports = pool;
