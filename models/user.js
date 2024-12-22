const db = require('../db');

// Create OTP table
db.run(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      email TEXT PRIMARY KEY,
      otp TEXT NOT NULL,
      expiry TIMESTAMP NOT NULL
    )
`);

// Create Users table with fields for store_id and role
db.run(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'pending'
    )
`);

const saveOtp = (email, otp, expiry) => {
    return new Promise((resolve, reject) => {
        const query = `INSERT OR REPLACE INTO otp_codes (email, otp, expiry) VALUES (?, ?, ?)`;
        db.run(query, [email, otp, expiry], function (err) {
            if (err) reject(err);
            else resolve();
        });
    });
};

const verifyOtp = (email, otp) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM otp_codes WHERE email = ? AND otp = ? AND expiry > datetime('now')`;
        db.get(query, [email, otp], (err, row) => {
            if (err) reject(err);
            else resolve(!!row); // Return true if OTP is valid
        });
    });
};

function createUser(email, storeId, role, callback) {
    const query = `
        INSERT INTO users (email, store_id, role, status) 
        VALUES (?, ?, ?, 'pending')
    `;
    db.run(query, [email, storeId, role], function (err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                console.error(`Duplicate entry: User with email "${email}" and store ID "${storeId}" already exists.`);
            } else {
                console.error('Error inserting user:', err.message);
            }
            return callback(err);
        }
        callback(null, { id: this.lastID, email, storeId, role, status: 'pending' });
    });
}

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

// Function to update a user's status
function updateUserStatus(email, status, callback) {
    const query = `
        UPDATE users 
        SET status = ? 
        WHERE email = ?
    `;
    db.run(query, [status, email], function (err) {
        if (err) {
            console.error('Error updating user status:', err.message);
            return callback(err);
        }
        callback(null, this.changes); // this.changes indicates rows updated
    });
}

// Function to delete a user by email
function deleteUser(email, callback) {
    const query = `
        DELETE FROM users WHERE email = ?
    `;
    db.run(query, [email], function (err) {
        if (err) {
            console.error('Error deleting user:', err.message);
            return callback(err);
        }
        callback(null, this.changes); // this.changes indicates rows deleted
    });
}

function getUserByEmailStoreAndRole(email, storeId, role, callback) {
    const query = `
        SELECT * FROM users WHERE email = ? AND store_id = ? AND role = ?
    `;
    db.get(query, [email, storeId, role], (err, row) => {
        callback(err, row);
    });
}

// Export the database and functions
module.exports = {
    db,
    createUser,
    getUserByEmailAndStore,
    updateUserStatus,
    deleteUser,
    saveOtp,
    verifyOtp,
    getUserByEmailStoreAndRole, // Add this
};

