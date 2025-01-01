require('dotenv').config();
const { Pool } = require('pg');
const pool = require('../db');

// Create OTP table
(async () => {
  const otpTableQuery = `
    CREATE TABLE IF NOT EXISTS otp_codes (
      email TEXT PRIMARY KEY,
      otp TEXT NOT NULL,
      expiry TIMESTAMP NOT NULL
    );
  `;
  const usersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'pending'
    );
  `;
  try {
    await pool.query(otpTableQuery);
    await pool.query(usersTableQuery);
    console.log('Tables created successfully.');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
})();

// Save OTP
const saveOtp = async (email, otp, expiry) => {
  const query = `
    INSERT INTO otp_codes (email, otp, expiry) 
    VALUES ($1, $2, $3)
    ON CONFLICT (email) 
    DO UPDATE SET otp = $2, expiry = $3;
  `;
  try {
    await pool.query(query, [email, otp, expiry]);
  } catch (err) {
    console.error('Error saving OTP:', err);
    throw err;
  }
};

// Verify OTP
const verifyOtp = async (email, otp) => {
  const query = `
    SELECT * FROM otp_codes 
    WHERE email = $1 AND otp = $2 AND expiry > NOW();
  `;
  try {
    const result = await pool.query(query, [email, otp]);
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error verifying OTP:', err);
    throw err;
  }
};

// Create User
const createUser = async (email, storeId, role) => {
  const query = `
    INSERT INTO users (email, store_id, role, status) 
    VALUES ($1, $2, $3, 'pending')
    ON CONFLICT (email) 
    DO NOTHING;
  `;
  try {
    await pool.query(query, [email, storeId, role]);
  } catch (err) {
    console.error('Error creating user:', err);
    throw err;
  }
};

// Get User by Email and Store
const getUserByEmailAndStore = async (email, storeId) => {
  const query = `
    SELECT * FROM users 
    WHERE email = $1 AND store_id = $2;
  `;
  try {
    const result = await pool.query(query, [email, storeId]);
    return result.rows[0];
  } catch (err) {
    console.error('Error fetching user by email and store:', err);
    throw err;
  }
};

// Update User Status
const updateUserStatus = async (email, status) => {
  const query = `
    UPDATE users 
    SET status = $1 
    WHERE email = $2;
  `;
  try {
    const result = await pool.query(query, [status, email]);
    return result.rowCount; // Number of rows updated
  } catch (err) {
    console.error('Error updating user status:', err);
    throw err;
  }
};

// Delete User
const deleteUser = async (email) => {
  const query = `
    DELETE FROM users 
    WHERE email = $1;
  `;
  try {
    const result = await pool.query(query, [email]);
    return result.rowCount; // Number of rows deleted
  } catch (err) {
    console.error('Error deleting user:', err);
    throw err;
  }
};

// Get User by Email, Store, and Role
const getUserByEmailStoreAndRole = async (email, storeId, role) => {
  const query = `
    SELECT * FROM users 
    WHERE email = $1 AND store_id = $2 AND role = $3;
  `;
  try {
    const result = await pool.query(query, [email, storeId, role]);
    return result.rows[0];
  } catch (err) {
    console.error('Error fetching user by email, store, and role:', err);
    throw err;
  }
};

// Get User Count by Email and Store
const getUserCountByEmailAndStore = async (email, storeId) => {
  const query = `
    SELECT COUNT(*) AS count 
    FROM users 
    WHERE email = $1 AND store_id = $2;
  `;
  try {
    const result = await pool.query(query, [email, storeId]);
    return parseInt(result.rows[0].count, 10);
  } catch (err) {
    console.error('Error counting users by email and store:', err);
    throw err;
  }
};

// Get User Count by Email
const getUserCountByEmail = async (email) => {
  const query = `
    SELECT COUNT(*) AS count 
    FROM users 
    WHERE email = $1;
  `;
  try {
    const result = await pool.query(query, [email]);
    return parseInt(result.rows[0].count, 10);
  } catch (err) {
    console.error('Error counting users by email:', err);
    throw err;
  }
};

module.exports = {
  pool,
  createUser,
  getUserByEmailAndStore,
  updateUserStatus,
  deleteUser,
  saveOtp,
  verifyOtp,
  getUserByEmailStoreAndRole,
  getUserCountByEmailAndStore,
  getUserCountByEmail,
};
