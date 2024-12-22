const db = require('../db');
                                                                      
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