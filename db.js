require('dotenv').config();
const { Pool } = require('pg');

// Initialize PostgreSQL connection pool without SSL for local database
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: false, // SSL not needed for local connections
});

// Test the connection
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database. Server time:', res.rows[0].now);
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database:', err);
  }
})();

module.exports = pool;
