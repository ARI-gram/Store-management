require('dotenv').config();
const { Pool } = require('pg');

// Determine if SSL is required based on the environment or database settings
const isSSLRequired = process.env.DB_SSL === 'true';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: isSSLRequired
    ? { rejectUnauthorized: false } // Allows connections even without a valid certificate
    : false, // No SSL
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



// set PGPASSWORD=ZexvzNYqrnEhh3HLA1s1xUNXEGNUUElL
//psql -h dpg-ctqgfmi3esus73dtn7og-a.oregon-postgres.render.com -U store_management_db_dews_user -d store_management_db_dews
