const pool = require('../db');

// Add a new order
const addOrder = (order, callback) => {
    const { item, code, description, quantity, units, dateOrdered, status, storeId } = order;

    const query = `
        INSERT INTO orders (item_name, code, description, quantity, units, date_ordered, status, store_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
    `;
    pool.query(query, [item, code, description, quantity, units, dateOrdered, status, storeId])
        .then((res) => callback(null, { id: res.rows[0].id }))
        .catch((err) => callback(err));
};

// Fetch all orders for a specific store
const getOrdersByStoreId = (storeId, callback) => {
    const query = "SELECT * FROM orders WHERE store_id = $1 ORDER BY date_ordered DESC";
    pool.query(query, [storeId])
        .then((res) => callback(null, res.rows))
        .catch((err) => callback(err));
};

// Fetch a single order by ID
const getOrderById = (orderId, storeId, callback) => {
    const query = "SELECT * FROM orders WHERE id = $1 AND store_id = $2";
    pool.query(query, [orderId, storeId])
        .then((res) => callback(null, res.rows[0]))
        .catch((err) => callback(err));
};

module.exports = {
    addOrder,
    getOrdersByStoreId,
    getOrderById,
};
