const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize database connection
const dbPath = path.join(__dirname, './database.db'); // Adjust the path to your database file
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err);
    } else {
        console.log('Connected to SQLite database.');
    }
});

module.exports = db;
