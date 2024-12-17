const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open the SQLite database
const dbPath = path.resolve(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});                                                                         
const Inventory = {
  getAllByStoreId(storeId) {
      return new Promise((resolve, reject) => {
          const query = "SELECT * FROM inventory WHERE store_id = ?";
          db.all(query, [storeId], (err, rows) => {
              if (err) {
                  return reject(err);
              }
              resolve(rows);
          });
      });
  },

  addItem({ code, item, description, quantity, units, date_in, store_id }) {
      return new Promise((resolve, reject) => {
          const query = `
              INSERT INTO inventory (code, item, description, quantity, units, date_in, store_id)
              VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          db.run(query, [code, item, description, quantity, units, date_in, store_id], function(err) {
              if (err) {
                  return reject(err);
              }
              resolve(this.lastID);
          });
      });
  },
};

module.exports = Inventory;