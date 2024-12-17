/**
 * ARI Gram Technologies - Inventory Management Module
 * This module defines the `Order` model for managing orders in the system.
 * Developed by ARI Gram Technologies.
 */

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database.db'); // Path to your database file

// Create Orders table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT,
            code TEXT,
            description TEXT,
            quantity INTEGER,
            units TEXT,
            date_ordered TEXT,
            status TEXT,
            store_id INTEGER
        )
    `);
});

const Order = {
    // Get all orders for a specific store
    getOrdersByStoreId: (storeId, callback) => {
        db.all("SELECT * FROM orders WHERE store_id = ?", [storeId], (err, rows) => {
            callback(err, rows);
        });
    },

    // Get a specific order by its ID
    getOrderById: (orderId, callback) => {
        db.get("SELECT * FROM orders WHERE id = ?", [orderId], (err, row) => {
            callback(err, row);
        });
    },

    // Create a new order
    createOrder: (orderData, callback) => {
        const { item_name, code, description, quantity, units, date_ordered, status, store_id } = orderData;
        db.run(
            "INSERT INTO orders (item_name, code, description, quantity, units, date_ordered, status, store_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [item_name, code, description, quantity, units, date_ordered, status, store_id],
            function (err) {
                callback(err, this.lastID);
            }
        );
    },

    // Update an order
    updateOrder: (orderId, updatedData, callback) => {
        const { item_name, code, description, quantity, units, date_ordered, status, store_id } = updatedData;
        db.run(
            "UPDATE orders SET item_name = ?, code = ?, description = ?, quantity = ?, units = ?, date_ordered = ?, status = ?, store_id = ? WHERE id = ?",
            [item_name, code, description, quantity, units, date_ordered, status, store_id, orderId],
            function (err) {
                callback(err);
            }
        );
    },

    // Delete an order
    deleteOrder: (orderId, callback) => {
        db.run("DELETE FROM orders WHERE id = ?", [orderId], function (err) {
            callback(err);
        });
    },

    // Get all orders for a specific store and date
    getOrdersByDate: (storeId, date, callback) => {
        const query = "SELECT item_name, code, description, quantity, units FROM orders WHERE store_id = ? AND date_ordered = ?";
        db.all(query, [storeId, date], (err, results) => {
            callback(err, results);
        });
    }
};

module.exports = Order;
