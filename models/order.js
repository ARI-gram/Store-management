const db = require('../db');

// Add a new order
const addOrder = (order, callback) => {
    const { item, code, description, quantity, units, dateOrdered, status, storeId } = order;

    const query = `
        INSERT INTO orders (item_name, code, description, quantity, units, date_ordered, status, store_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(query, [item, code, description, quantity, units, dateOrdered, status, storeId], function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID });
    });
};

// Fetch all orders for a specific store
const getOrdersByStoreId = (storeId, callback) => {
    const query = "SELECT * FROM orders WHERE store_id = ? ORDER BY date_ordered DESC";
    db.all(query, [storeId], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
    });
};

// Fetch a single order by ID
const getOrderById = (orderId, storeId, callback) => {
    const query = "SELECT * FROM orders WHERE id = ? AND store_id = ?";
    db.get(query, [orderId, storeId], (err, row) => {
        if (err) return callback(err);
        callback(null, row);
    });
};

module.exports = {
    addOrder,
    getOrdersByStoreId,
    getOrderById,
};
