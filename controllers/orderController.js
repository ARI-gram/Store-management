const pool = require('../db');
const moment = require('moment');
const pdf = require('html-pdf');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

// ✅ Display all orders for a specific store
exports.displayOrders = async (req, res) => {
    const storeId = req.params.storeId;

    const query = "SELECT * FROM orders WHERE store_id = $1 ORDER BY date_ordered DESC";
    try {
        const result = await pool.query(query, [storeId]);
        res.render('orders', { orders: result.rows, storeId });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving orders.");
    }
};

// ✅ View details of a specific order
exports.viewOrderDetails = async (req, res) => {
    const { storeId, orderId } = req.params;

    const query = "SELECT * FROM orders WHERE id = $1 AND store_id = $2";
    try {
        const result = await pool.query(query, [orderId, storeId]);
        if (result.rows.length === 0) {
            return res.status(404).send("Order not found.");
        }
        const order = result.rows[0];
        res.render('orderDetails', { order, storeId });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving order details.");
    }
};

exports.createOrder = async (req, res) => {
    const { item, code, description, quantity, units, dateOrdered, status, fromStoreId, toStoreId } = req.body;
    const storeId = req.params.storeId;

    try {
        // Check if to_store_id exists in the stores table
        const storeCheckQuery = `SELECT store_id FROM stores WHERE store_id = $1`;
        const storeCheckResult = await pool.query(storeCheckQuery, [toStoreId]);

        if (storeCheckResult.rows.length === 0) {
            return res.status(400).send("Error: Store ID not registered. Kindly contact admin.");
        }

        // Proceed to create the order if to_store_id is valid
        const query = `
            INSERT INTO orders (item_name, code, description, quantity, units, date_ordered, status, from_store_id, to_store_id, store_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        await pool.query(query, [item, code, description, quantity, units, dateOrdered, status, fromStoreId, toStoreId, storeId]);

        // Redirect back to where the order was created
        res.redirect(`/${storeId}/orders`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating order.");
    }
};

exports.displayNewOrders = async (req, res) => {
    const storeId = req.params.storeId; 
    const selectedDate = req.query.date; // Get selected date from query string

    let query = `
        SELECT id, item_name, code, description, quantity, units, date_ordered, status, from_store_id
        FROM orders
        WHERE to_store_id = $1
    `;

    const params = [storeId];

    if (selectedDate) {
        query += ` AND date_ordered = $2`;
        params.push(selectedDate);
    }

    query += ` ORDER BY date_ordered DESC`;

    try {
        const result = await pool.query(query, params);
        res.render('NewOrders', { orders: result.rows, storeId, selectedDate });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving new orders.");
    }
};

// ✅ Display edit status form
exports.editOrderStatus = async (req, res) => {
    const orderId = req.params.orderId;
    const storeId = req.query.storeId || req.params.storeId;

    try {
        const query = `SELECT id, status, checked_by, date_checked, supplier, quantity_supplied, units_supplied FROM orders WHERE id = $1`;
        const result = await pool.query(query, [orderId]);

        if (result.rows.length === 0) {
            return res.status(404).send("Order not found.");
        }

        const order = result.rows[0];

        // Convert date_checked to a Date object if it exists
        if (order.date_checked) {
            order.date_checked = new Date(order.date_checked);
        }

        if (order.status !== 'Pending') {
            return res.render('EditStatus', {
                error: "Status already updated.",
                order: null,
                storeId
            });
        }

        res.render('EditStatus', { order, error: null, storeId });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving order details.");
    }
};

// ✅ Update order status
exports.updateOrderStatus = async (req, res) => {
    const orderId = req.params.orderId;
    const { status, checked_by, date_checked, supplier, quantity_supplied, units_supplied } = req.body;
    const storeId = req.query.storeId;

    try {
        if (!orderId || !storeId) {
            return res.status(400).send("Order ID and Store ID are required.");
        }

        const checkQuery = `SELECT status FROM orders WHERE id = $1`;
        const checkResult = await pool.query(checkQuery, [orderId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).send("Order not found.");
        }

        const order = checkResult.rows[0];

        if (order.status !== 'Pending') {
            return res.render('EditStatus', {
                error: "Status already updated.",
                order: null,
                storeId
            });
        }

        // Update query for the order
        const updateQuery = `
            UPDATE orders
            SET 
                status = $1, 
                checked_by = $2, 
                date_checked = $3, 
                supplier = $4, 
                quantity_supplied = $5, 
                units_supplied = $6
            WHERE id = $7
        `;

        // Execute the update query
        await pool.query(updateQuery, [
            status, 
            checked_by || null, 
            date_checked || null, 
            supplier || null, 
            quantity_supplied || null, 
            units_supplied || null, 
            orderId
        ]);

        // Redirect with success message
        res.redirect(`/${storeId}/orders?message=Status updated successfully`);
    } catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).send("Error updating order status.");
    }
};


// Middleware to check admin role
const checkAdminRole = (req, res, next) => {
    const { user } = req.session; // Assuming user details are stored in the session after login
    if (!user || user.role !== 'admin') {
        return res.status(403).render('errorPage', { message: 'Access Denied. Admin privileges required.' });
    }
    next();
};

// ✅ Render the edit order form (Admin-only)
exports.editOrder = [checkAdminRole, async (req, res) => {
    const orderId = req.params.orderId;
    const storeId = req.params.storeId;

    const query = "SELECT * FROM orders WHERE id = $1 AND store_id = $2";
    try {
        const result = await pool.query(query, [orderId, storeId]);
        const order = result.rows[0];
        if (!order) {
            return res.status(404).send("Order not found.");
        }
        res.render('editOrder', { order, storeId });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching order details.");
    }
}];

// ✅ Update an existing order with fromStoreId and toStoreId (Admin-only)
exports.updateOrder = [checkAdminRole, async (req, res) => {
    const orderId = req.params.orderId;
    const storeId = req.params.storeId;
    const { item, code, description, quantity, units, dateOrdered, status, fromStoreId, toStoreId } = req.body;

    const query = `
        UPDATE orders
        SET item_name = $1, code = $2, description = $3, quantity = $4, units = $5, date_ordered = $6, status = $7, from_store_id = $8, to_store_id = $9
        WHERE id = $10 AND store_id = $11
    `;
    try {
        await pool.query(query, [item, code, description, quantity, units, dateOrdered, status, fromStoreId, toStoreId, orderId, storeId]);
        res.redirect(`/${storeId}/orders`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating order.");
    }
}];

// ✅ Delete an order (Admin-only)
exports.deleteOrder = [checkAdminRole, async (req, res) => {
    const orderId = req.params.orderId;
    const storeId = req.params.storeId;

    const query = "DELETE FROM orders WHERE id = $1 AND store_id = $2";
    try {
        await pool.query(query, [orderId, storeId]);
        res.redirect(`/${storeId}/orders`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting order.");
    }
}];

// ✅ Search orders by date
exports.searchOrdersByDate = async (req, res) => {
    const storeId = req.params.storeId;
    const date = req.query.date;  // The date will be passed from the form

    const query = "SELECT * FROM orders WHERE store_id = $1 AND date_ordered = $2 ORDER BY date_ordered DESC";
    try {
        const result = await pool.query(query, [storeId, date]);

        // Get current date and time for display purposes
        const currentTime = moment().format('HH:mm:ss');
        const currentDate = moment().format('YYYY-MM-DD');

        res.render('orderDisplay', { orders: result.rows, storeId, currentTime, currentDate });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving orders.");
    }
};

// ✅ Generate PDF for orders (Optional)
exports.generateOrdersPDF = async (req, res) => {
    const storeId = req.params.storeId;

    const query = "SELECT * FROM orders WHERE store_id = $1 ORDER BY date_ordered DESC";
    try {
        const result = await pool.query(query, [storeId]);
        const orders = result.rows;

        const filePath = path.join(__dirname, '../templates/ordersTemplate.ejs');
        ejs.renderFile(filePath, { orders, moment }, (err, html) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error generating PDF.");
            }
            pdf.create(html).toStream((err, stream) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error creating PDF stream.");
                }
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=orders.pdf');
                stream.pipe(res);
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving orders for PDF generation.");
    }
};
