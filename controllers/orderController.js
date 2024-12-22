const db = require('../db');
const moment = require('moment');

// Display all orders for a specific store
exports.displayOrders = (req, res) => {
    const storeId = req.params.storeId;

    const query = "SELECT * FROM orders WHERE store_id = ? ORDER BY date_ordered DESC";
    db.all(query, [storeId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving orders.");
        }

        res.render('orders', { orders: rows, storeId });
    });
};

// Create a new order
exports.createOrder = (req, res) => {
    const { item, code, description, quantity, units, dateOrdered, status } = req.body;
    const storeId = req.params.storeId;

    const query = `
        INSERT INTO orders (item_name, code, description, quantity, units, date_ordered, status, store_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(query, [item, code, description, quantity, units, dateOrdered, status, storeId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send("Error creating order.");
        }

        res.redirect(`/${storeId}/orders`);
    });
};

// Render the edit order form
exports.editOrder = (req, res) => {
    const orderId = req.params.orderId;
    const storeId = req.params.storeId;

    const query = "SELECT * FROM orders WHERE id = ? AND store_id = ?";
    db.get(query, [orderId, storeId], (err, order) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching order details.");
        }

        if (!order) {
            return res.status(404).send("Order not found.");
        }

        res.render('editOrder', { order, storeId });
    });
};

// Update an existing order
exports.updateOrder = (req, res) => {
    const orderId = req.params.orderId;
    const storeId = req.params.storeId;
    const { item, code, description, quantity, units, dateOrdered, status } = req.body;

    const query = `
        UPDATE orders
        SET item_name = ?, code = ?, description = ?, quantity = ?, units = ?, date_ordered = ?, status = ?
        WHERE id = ? AND store_id = ?
    `;
    db.run(query, [item, code, description, quantity, units, dateOrdered, status, orderId, storeId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send("Error updating order.");
        }

        res.redirect(`/${storeId}/orders`);
    });
};

// Delete an order
exports.deleteOrder = (req, res) => {
    const orderId = req.params.orderId;
    const storeId = req.params.storeId;

    const query = "DELETE FROM orders WHERE id = ? AND store_id = ?";
    db.run(query, [orderId, storeId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send("Error deleting order.");
        }

        res.redirect(`/${storeId}/orders`);
    });
};

// Search orders by date
exports.searchOrdersByDate = (req, res) => {
    const storeId = req.params.storeId;
    const date = req.query.date;  // The date will be passed from the form

    const query = "SELECT * FROM orders WHERE store_id = ? AND date_ordered = ? ORDER BY date_ordered DESC";
    db.all(query, [storeId, date], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving orders.");
        }

        // Get current date and time for display purposes
        const currentTime = moment().format('HH:mm:ss');
        const currentDate = moment().format('YYYY-MM-DD');

        // Render the orders display page
        res.render('orderDisplay', { orders: rows, storeId, currentTime, currentDate });
    });
};
