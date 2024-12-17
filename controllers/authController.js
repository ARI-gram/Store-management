require('dotenv').config();
const nodemailer = require('nodemailer');
const { db, createUser, getUserByEmail, saveOtp, verifyOtp, getUserByEmailStoreAndRole } = require('../models/user');
const crypto = require('crypto');

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
  //const expiry = new Date(Date.now() + 3 * 60 * 60 * 1000);
  try {
    await saveOtp(email, otp, expiry.toISOString());

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
     text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
      //text: `Your OTP code is ${otp}. It is valid for 3 hours.`,
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
      // Verify OTP
      const isValid = await verifyOtp(trimmedEmail, otp);

      if (!isValid) {
          return res.status(400).send({ message: 'Invalid or expired OTP.' });
      }

      // Query the database to get the user details by email, storeId, and role
      const userQuery = `
          SELECT status, store_id, role 
          FROM users 
          WHERE email = ? AND store_id = ? AND role = ?`;

      db.get(userQuery, [trimmedEmail, trimmedStoreId, trimmedRole], (err, userRow) => {
          if (err) {
              console.error('Error fetching user data:', err);
              return res.status(500).send({ message: 'Error fetching user details.' });
          }

          // Check if the user exists in the database
          if (!userRow) {
              return res.status(404).send({ message: 'User not found with the provided details.' });
          }

          // Check if the user's status is 'approved'
          if (userRow.status !== 'approved') {
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
      });
  } catch (error) {
      console.error('Error verifying OTP:', error);
      return res.status(500).send({ message: 'Error verifying OTP.' });
  }
};

// Sign Up
exports.signup = (req, res) => {
  const { signInEmail, signInStoreId, signInRole } = req.body;

  if (!signInEmail || !signInStoreId || !signInRole) {
    return res.status(400).send({ message: 'Email, Store ID, and Role are required.' });
  }

  getUserByEmailStoreAndRole(signInEmail, signInStoreId, signInRole, (err, existingUser) => {
    if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).send({ message: 'Database error.' });
    }

    // Prevent duplication based on email + store_id
    if (existingUser) {
        return res.status(400).send({
            message: `User with email "${signInEmail}" and store ID "${signInStoreId}" already exists.`
        });
    }

    // Check email registration across stores
    getUserCountByEmailAndStore(signInEmail, (err, count) => {
        if (err) {
            console.error('Error fetching user count:', err);
            return res.status(500).send({ message: 'Database error.' });
        }

        if (count >= 8) {
            return res.status(400).send({
                message: 'This email has reached the maximum registration limit of 8 different stores.'
            });
        }

        createUser(signInEmail, signInStoreId, signInRole, (err, newUser) => {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).send({
                        message: `User with email "${signInEmail}" and store ID "${signInStoreId}" already exists.`
                    });
                }
                return res.status(500).send({ message: 'Error during signup.' });
            }

            res.status(201).send({
                message: 'Signup successful. Awaiting approval.',
                user: newUser
            });
        });
    });
});
};

// Function to check if email and store_id combination is unique
function getUserByEmailAndStore(email, storeId, callback) {
  const query = `SELECT * FROM users WHERE email = ? AND store_id = ?`;
  db.get(query, [email, storeId], callback);
}

// Function to count the number of registrations for an email (with different store IDs)
function getUserCountByEmailAndStore(email, callback) {
  const query = `SELECT COUNT(DISTINCT store_id) as count FROM users WHERE email = ?`;
  db.get(query, [email], (err, row) => {
    if (err) {
      return callback(err);
    }
    callback(null, row.count);
  });
}

// Function to check if email and store_id combination is unique
function getUserByEmailAndStore(email, storeId, callback) {
  const query = `SELECT * FROM users WHERE email = ? AND store_id = ?`;
  db.get(query, [email, storeId], callback);
}

// Function to count the number of registrations for an email
function getUserCountByEmail(email, callback) {
  const query = `SELECT COUNT(*) as count FROM users WHERE email = ?`;
  db.get(query, [email], (err, row) => {
    if (err) {
      return callback(err);
    }
    callback(null, row.count);
  });
}

// Adjust database function to check user within store
function getUserByEmailAndStore(email, storeId, callback) {
  const query = `SELECT * FROM users WHERE email = ? AND store_id = ?`;
  db.get(query, [email, storeId], callback);
}

// Get pending users
exports.getPendingUsers = (req, res) => {
  db.all('SELECT * FROM users WHERE status = ?', ['pending'], (err, results) => {
    if (err) {
      console.error('Error fetching pending users:', err);
      return res.status(500).send({ message: 'Database error.' });
    }
    res.render('pending-users', { users: results });
  });
};

// Function to get a user by email and store_id
function getUserByEmailAndStore(email, storeId, callback) {
  const query = `SELECT * FROM users WHERE email = ? AND store_id = ?`;
  db.get(query, [email, storeId], (err, row) => {
      if (typeof callback === 'function') {
          callback(err, row);
      } else {
          console.error('Callback is not a function');
      }
  });
}

exports.approveUser = (req, res) => {
  console.log(req.body); // Log request body for debugging
  const { email } = req.body;

  if (!email) {
    return res.status(400).send(`
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
          <h1 style="color: #e74c3c;">Error</h1>
          <p style="font-size: 18px; color: #555;">Email is required.</p>
          <a href="/" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">Go Back</a>
        </div>
      </div>
    `);
  }

  const approveUserQuery = `UPDATE users SET status = 'approved' WHERE email = ?`;
  db.run(approveUserQuery, [email], function (err) {
    if (err) {
      console.error('Error approving user:', err);
      return res.status(500).send(`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
            <h1 style="color: #e74c3c;">Error</h1>
            <p style="font-size: 18px; color: #555;">Error approving user. Please try again later.</p>
            <a href="/" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">Go Back</a>
          </div>
        </div>
      `);
    }

    if (this.changes === 0) {
      return res.status(404).send(`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
            <h1 style="color: #e74c3c;">Error</h1>
            <p style="font-size: 18px; color: #555;">User not found.</p>
            <a href="/" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">Go Back</a>
          </div>
        </div>
      `);
    }

    console.log('User approved successfully with email:', email); // Log success
    res.send(`
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
          <h1 style="color: #2ecc71;">Success</h1>
          <p style="font-size: 18px; color: #555;">User approved successfully.</p>
          <a href="/" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">Go Back</a>
        </div>
      </div>
    `);
  });
};

// Get active users
exports.getActiveUsers = (req, res) => {
  db.all('SELECT * FROM users WHERE status = ?', ['approved'], (err, results) => {
    if (err) {
      console.error('Error fetching active users:', err);
      return res.status(500).send({ message: 'Database error.' });
    }
    res.render('active-users', { users: results });
  });
};
// Render Edit User page
exports.renderEditUser = (req, res) => {
  const { email, store_id } = req.params;

  db.get('SELECT * FROM users WHERE email = ? AND store_id = ?', [email, store_id], (err, user) => {
    if (err) {
      console.error('Error fetching user for editing:', err);
      return res.status(500).send({ message: 'Database error.' });
    }
    if (!user) {
      return res.status(404).send('User not found.');
    }
    res.render('edit-user', { user });
  });
};

// Update User
exports.editUser = (req, res) => {
  const { email, store_id } = req.params;
  const { role } = req.body;

  db.run('UPDATE users SET role = ? WHERE email = ? AND store_id = ?', [role, email, store_id], (err) => {
    if (err) {
      console.error('Error editing user:', err);
      return res.status(500).send({ message: 'Database error.' });
    }
    res.redirect('/active-users');
  });
};

// Delete User
exports.deleteUser = (req, res) => {
  const { email, store_id } = req.params;

  db.run('DELETE FROM users WHERE email = ? AND store_id = ?', [email, store_id], (err) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).send({ message: 'Database error.' });
    }
    res.redirect(req.headers.referer || '/');
  });
};
exports.createStore = (req, res) => {
  const { email, store_id } = req.body;

  if (!email || !store_id) {
    return res.status(400).send(`
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
              <h1 style="color: #e74c3c;">Error</h1>
              <p style="font-size: 18px; color: #555;">Email and Store ID are required.</p>
              <button onclick="window.history.back()" style="margin-top: 20px; padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">OK</button>
          </div>
      </div>
    `);
  }

  // Check if the store already exists
  const checkStoreQuery = `SELECT * FROM stores WHERE store_id = ?`;
  db.get(checkStoreQuery, [store_id], (err, existingStore) => {
    if (err) {
      console.error('Error checking store existence:', err);
      return res.status(500).send(`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                <h1 style="color: #e74c3c;">Error</h1>
                <p style="font-size: 18px; color: #555;">Database error occurred.</p>
                <button onclick="window.history.back()" style="margin-top: 20px; padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">OK</button>
            </div>
        </div>
      `);
    }

    if (existingStore) {
      return res.status(400).send(`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                <h1 style="color: #e74c3c;">Error</h1>
                <p style="font-size: 18px; color: #555;">Store already exists.</p>
                <button onclick="window.history.back()" style="margin-top: 20px; padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">OK</button>
            </div>
        </div>
      `);
    }

    // Insert a new store
    const createStoreQuery = `INSERT INTO stores (store_id, email, created_at) VALUES (?, ?, ?)`;
    const createdAt = new Date().toISOString();
    db.run(createStoreQuery, [store_id, email, createdAt], (err) => {
      if (err) {
        console.error('Error creating store:', err);
        return res.status(500).send(`
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
              <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                  <h1 style="color: #e74c3c;">Error</h1>
                  <p style="font-size: 18px; color: #555;">Error creating store.</p>
                  <button onclick="window.history.back()" style="margin-top: 20px; padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">OK</button>
              </div>
          </div>
        `);
      }

      res.redirect('/active-users'); // Redirect back to active users
    });
  });
};

// Display all stores
exports.getStores = (req, res) => {
  db.all('SELECT * FROM stores', [], (err, rows) => {
    if (err) {
      console.error('Error fetching stores:', err);
      return res.status(500).send('Database error.');
    }
    res.render('stores', { stores: rows });
  });
};

// Render the edit store page
exports.renderEditStore = (req, res) => {
  const storeId = req.params.store_id;
  db.get('SELECT * FROM stores WHERE store_id = ?', [storeId], (err, store) => {
    if (err) {
      console.error('Error fetching store:', err);
      return res.status(500).send('Database error.');
    }
    res.render('edit-store', { store });
  });
};

// Update a store
exports.updateStore = (req, res) => {
  const storeId = req.params.store_id;
  const { email } = req.body;
  db.run('UPDATE stores SET email = ? WHERE store_id = ?', [email, storeId], (err) => {
    if (err) {
      console.error('Error updating store:', err);
      return res.status(500).send('Database error.');
    }
    res.redirect('/stores');
  });
};

// Delete a store
exports.deleteStore = (req, res) => {
  const storeId = req.params.store_id;
  db.run('DELETE FROM stores WHERE store_id = ?', [storeId], (err) => {
    if (err) {
      console.error('Error deleting store:', err);
      return res.status(500).send('Database error.');
    }
    res.redirect('/stores');
  });
};