require('dotenv').config();
const pool = require('../db'); 
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const crypto = require('crypto');
const user = require('../models/user'); 
const { createUser, verifyOtp, saveOtp, updateUserStatus, deleteUser } = user;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate OTP
exports.generateOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).send({ message: 'Email is required.' });

  const otp = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

  try {
    const client = await pool.connect();

    // Save OTP to database
    const saveOtpQuery = `
      INSERT INTO otp_codes (email, otp, expiry)  -- Use "otp_codes" instead of "otps"
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET otp = EXCLUDED.otp, expiry = EXCLUDED.expiry;
    `;
    await client.query(saveOtpQuery, [email, otp, expiry]);

    client.release();

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
    });

    res.send({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).send({ message: 'Error sending OTP.' });
  }
};
exports.verifyOtp = async (req, res) => {
  const { email, otp, storeId, role } = req.body;

  // Trim all inputs to avoid issues with extra spaces
  const trimmedEmail = email.trim();
  const trimmedStoreId = storeId.trim();
  const trimmedRole = role.trim();

  if (!trimmedEmail || !otp || !trimmedStoreId || !trimmedRole) {
    return res.status(400).send({ message: 'Email, OTP, Store ID, and Role are required.' });
  }

  try {
    const client = await pool.connect();

    // Verify OTP
    const verifyOtpQuery = `
      SELECT otp, expiry FROM otp_codes WHERE email = $1;  -- Use "otp_codes" instead of "otps"
    `;
    const otpResult = await client.query(verifyOtpQuery, [trimmedEmail]);

    if (otpResult.rowCount === 0 || otpResult.rows[0].otp !== otp || new Date(otpResult.rows[0].expiry) < new Date()) {
      client.release();
      return res.status(400).send({ message: 'Invalid or expired OTP.' });
    }

    // Query the database to get the user details by email, storeId, and role
    const userQuery = `
      SELECT status, store_id, role 
      FROM users 
      WHERE email = $1 AND store_id = $2 AND role = $3;
    `;
    const userResult = await client.query(userQuery, [trimmedEmail, trimmedStoreId, trimmedRole]);

    if (userResult.rowCount === 0) {
      client.release();
      return res.status(404).send({ message: 'User not found with the provided details.' });
    }

    const userRow = userResult.rows[0];

    // Check if the user's status is 'approved'
    if (userRow.status !== 'approved') {
      client.release();
      return res.status(403).send({
        message: 'Your account is not approved by the admin. Please contact support.',
      });
    }

    // Store user details and permissions in the session
    req.session.user = {
      email: trimmedEmail,
      storeId: trimmedRole === 'admin' && trimmedStoreId === 'admin' ? null : trimmedStoreId,
      role: trimmedRole,
    };

    client.release();

    // Redirect based on the user's role and store ID
    if (trimmedRole === 'admin' && trimmedStoreId === 'admin') {
      return res.status(200).json({ redirect: '/admin' });
    } else if (trimmedRole === 'admin') {
      return res.status(200).json({ redirect: `/dashboard/${trimmedStoreId}` });
    } else if (
      (trimmedRole === 'store keeper' || trimmedRole === 'store manager') &&
      trimmedStoreId === userRow.store_id
    ) {
      return res.status(200).json({ redirect: `/dashboard/${trimmedStoreId}` });
    } else {
      return res.status(403).send({
        message: 'Access denied. Invalid role or store assignment.',
      });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).send({ message: 'Error verifying OTP.' });
  }
};

// Sign Up
exports.signup = async (req, res) => {
  const { signInEmail, signInStoreId, signInRole } = req.body;

  if (!signInEmail || !signInStoreId || !signInRole) {
    return res.status(400).send({ message: 'Email, Store ID, and Role are required.' });
  }

  try {
    const client = await pool.connect();

    try {
      // Check if user already exists
      const existingUserQuery = `SELECT * FROM users WHERE email = $1 AND store_id = $2 AND role = $3`;
      const existingUserResult = await client.query(existingUserQuery, [signInEmail, signInStoreId, signInRole]);

      if (existingUserResult.rows.length > 0) {
        return res.status(400).send({
          message: `User with email "${signInEmail}" and store ID "${signInStoreId}" already exists.`
        });
      }

      // Check email registration across stores
      const userCountQuery = `SELECT COUNT(*) FROM users WHERE email = $1`;
      const userCountResult = await client.query(userCountQuery, [signInEmail]);
      const userCount = parseInt(userCountResult.rows[0].count, 10);

      if (userCount >= 8) {
        return res.status(400).send({
          message: 'This email has reached the maximum registration limit of 8 different stores.'
        });
      }

      // Create new user
      const createUserQuery = `
        INSERT INTO users (email, store_id, role, status) 
        VALUES ($1, $2, $3, 'pending') 
        RETURNING *
      `;
      const createUserResult = await client.query(createUserQuery, [signInEmail, signInStoreId, signInRole]);

      res.status(201).send({
        message: 'Signup successful. Awaiting approval.',
        user: createUserResult.rows[0]
      });
    } catch (err) {
      console.error('Error during signup:', err);
      res.status(500).send({ message: 'Error during signup.' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).send({ message: 'Database connection error.' });
  }
};
// Get pending users
exports.getPendingUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE status = $1', ['pending']);
    res.render('pending-users', { users: result.rows });
  } catch (err) {
    console.error('Error fetching pending users:', err);
    res.status(500).send({ message: 'Database error.' });
  }
};

// Approve user
exports.approveUser = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send('Email is required.');
  }

  try {
    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE email = $2 RETURNING *',
      ['approved', email]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('User not found.');
    }

    console.log('User approved successfully:', email);
    res.render('active-users', { users: result.rows });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).send('Error approving user.');
  }
};

// Get active users
exports.getActiveUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE status = $1', ['approved']);
    res.render('active-users', { users: result.rows });
  } catch (err) {
    console.error('Error fetching active users:', err);
    res.status(500).send({ message: 'Database error.' });
  }
};

// Render Edit User page
exports.renderEditUser = async (req, res) => {
  const { email, store_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND store_id = $2',
      [email, store_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('User not found.');
    }

    res.render('edit-user', { user: result.rows[0] });
  } catch (err) {
    console.error('Error fetching user for editing:', err);
    res.status(500).send({ message: 'Database error.' });
  }
};

// Update user
exports.editUser = async (req, res) => {
  const { email, store_id } = req.params;
  const { role } = req.body;

  try {
    await pool.query(
      'UPDATE users SET role = $1 WHERE email = $2 AND store_id = $3',
      [role, email, store_id]
    );
    res.redirect('/active-users');
  } catch (err) {
    console.error('Error editing user:', err);
    res.status(500).send({ message: 'Database error.' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { email, store_id } = req.params;

  try {
    await pool.query(
      'DELETE FROM users WHERE email = $1 AND store_id = $2',
      [email, store_id]
    );
    res.redirect(req.headers.referer || '/');
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).send({ message: 'Database error.' });
  }
};

// Create store
exports.createStore = async (req, res) => {
  const { email, store_id } = req.body;

  if (!email || !store_id) {
    return res.status(400).send('Email and Store ID are required.');
  }

  try {
    // Check if the store already exists
    const existingStore = await pool.query(
      'SELECT * FROM stores WHERE store_id = $1',
      [store_id]
    );

    if (existingStore.rows.length > 0) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Store Exists</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f8f9fa;
            }
            .message {
              font-size: 1.5em;
              color: #dc3545;
              margin-bottom: 20px;
            }
            .button {
              padding: 10px 20px;
              font-size: 1em;
              color: #fff;
              background-color: #007bff;
              border: none;
              border-radius: 5px;
              text-decoration: none;
              cursor: pointer;
            }
            .button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="message">Store already exists.</div>
          <a href="javascript:history.back()" class="button">Go Back</a>
        </body>
        </html>
      `);
    }  

    // Insert a new store
    const createdAt = new Date().toISOString();
    await pool.query(
      'INSERT INTO stores (store_id, email, created_at) VALUES ($1, $2, $3)',
      [store_id, email, createdAt]
    );

    res.redirect('/active-users');
  } catch (err) {
    console.error('Error creating store:', err);
    res.status(500).send('Error creating store.');
  }
};
// Display all stores
exports.getStores = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores');
    res.render('stores', { stores: result.rows });
  } catch (err) {
    console.error('Error fetching stores:', err);
    res.status(500).send('Database error.');
  }
};

// Render the edit store page
exports.renderEditStore = async (req, res) => {
  const storeId = req.params.store_id;

  try {
    const result = await pool.query('SELECT * FROM stores WHERE store_id = $1', [storeId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Store not found.');
    }

    res.render('edit-store', { store: result.rows[0] });
  } catch (err) {
    console.error('Error fetching store:', err);
    res.status(500).send('Database error.');
  }
};

// Update a store
exports.updateStore = async (req, res) => {
  const storeId = req.params.store_id;
  const { email } = req.body;

  try {
    const result = await pool.query(
      'UPDATE stores SET email = $1 WHERE store_id = $2',
      [email, storeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Store not found.');
    }

    res.redirect('/stores');
  } catch (err) {
    console.error('Error updating store:', err);
    res.status(500).send('Database error.');
  }
};

exports.deleteStore = async (req, res) => {
  const storeId = req.params.store_id;

  try {
    await pool.query('BEGIN'); // Start transaction

    // Delete related rows manually
    await pool.query('DELETE FROM deliveries WHERE store_id = $1 OR from_store_id = $1 OR to_store_id = $1', [storeId]);
    await pool.query('DELETE FROM utilize WHERE store_id = $1', [storeId]);
    await pool.query('DELETE FROM orders WHERE store_id = $1', [storeId]);
    await pool.query('DELETE FROM inventory WHERE store_id = $1', [storeId]);

    // Delete the store itself
    const result = await pool.query('DELETE FROM stores WHERE store_id = $1', [storeId]);

    if (result.rowCount === 0) {
      await pool.query('ROLLBACK'); // Rollback transaction
      return res.status(404).send('Store not found.');
    }

    await pool.query('COMMIT'); // Commit transaction
    res.redirect('/stores');
  } catch (err) {
    await pool.query('ROLLBACK'); // Rollback transaction on error
    console.error('Error deleting store:', err);
    res.status(500).send('Database error.');
  }
};
