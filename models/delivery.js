// models/delivery.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database.db');  // Adjust the database path if necessary

// Function to add a delivery
const addDelivery = (delivery, callback) => {
    const { code, item, description, quantity, units, dateSent, timeSent, driver, authorization, vehicleNo, storeId, received } = delivery;

    // Check if inventory has enough quantity
    const checkInventoryQuery = `SELECT * FROM inventory WHERE code = ? AND item = ? AND store_id = ?`;
    db.get(checkInventoryQuery, [code, item, storeId], (err, row) => {
        if (err) {
            return callback(err);
        }

        if (!row || row.quantity < quantity) {
            return callback(new Error('Not enough stock in inventory.'));
        }

        // Insert the delivery record into the deliveries table
        const insertDeliveryQuery = `INSERT INTO deliveries (code, item, description, quantity, units, date_sent, time_sent, driver, authorization, vehicle_no, store_id, received)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(insertDeliveryQuery, [code, item, description, quantity, units, dateSent, timeSent, driver, authorization, vehicleNo, storeId, received], function (err) {
            if (err) {
                return callback(err);
            }

            // Update inventory by subtracting the quantity delivered
            const updateInventoryQuery = `UPDATE inventory SET quantity = quantity - ? WHERE code = ? AND item = ? AND store_id = ?`;
            db.run(updateInventoryQuery, [quantity, code, item, storeId], (err) => {
                if (err) {
                    return callback(err);
                }

                callback(null, { id: this.lastID });
            });
        });
    });
};

// Function to get deliveries for a specific store
const getDeliveriesByStoreId = (storeId, callback) => {
    const query = `SELECT * FROM deliveries WHERE store_id = ? ORDER BY date_sent DESC`;
    db.all(query, [storeId], (err, rows) => {
        if (err) {
            return callback(err);
        }
        callback(null, rows);
    });
};

module.exports = {
    addDelivery,
    getDeliveriesByStoreId
};
