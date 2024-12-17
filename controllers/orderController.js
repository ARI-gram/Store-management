const Order = require('../models/order');

// Render order page with the orders of the specific store
exports.getOrders = (req, res) => {
    const storeId = req.params.storeId;
    
    Order.getOrdersByStoreId(storeId, (err, orders) => {
        if (err) {
            return res.status(500).send("Error retrieving orders.");
        }
        res.render('orders', { storeId, orders });
    });
};

// Handle order creation
exports.createOrder = (req, res) => {
    const { item, code, description, quantity, units, dateOrdered, status, storeId } = req.body;

    const newOrder = {
        item_name: item,
        code: code,
        description: description,
        quantity: quantity,
        units: units,
        date_ordered: dateOrdered,
        status: status,
        store_id: storeId
    };

    Order.createOrder(newOrder, (err, orderId) => {
        if (err) {
            return res.status(500).send("Error creating order.");
        }
        res.redirect(`/${storeId}/orders`);
    });
};

// Get order details for editing
exports.editOrder = (req, res) => {
    const storeId = req.params.storeId;
    const orderId = req.params.orderId;

    Order.getOrderById(orderId, (err, order) => {
        if (err) {
            return res.status(500).send("Error retrieving order details.");
        }
        res.render('editOrder', { storeId, order });
    });
};

// Update order details after editing
exports.updateOrder = (req, res) => {
    const orderId = req.params.orderId;
    const { item, code, description, quantity, units, dateOrdered, status, storeId } = req.body;

    const updatedOrder = {
        item_name: item,
        code: code,
        description: description,
        quantity: quantity,
        units: units,
        date_ordered: dateOrdered,
        status: status,
        store_id: storeId
    };

    Order.updateOrder(orderId, updatedOrder, (err) => {
        if (err) {
            return res.status(500).send("Error updating order.");
        }
        res.redirect(`/${storeId}/orders`);
    });
};

// Delete an order
exports.deleteOrder = (req, res) => {
    const orderId = req.params.orderId;
    const storeId = req.params.storeId;

    Order.deleteOrder(orderId, (err) => {
        if (err) {
            return res.status(500).send("Error deleting order.");
        }
        res.redirect(`/${storeId}/orders`);
    });
};

exports.getOrdersByDate = (req, res) => {
    const { storeId } = req.params;
    const { date } = req.query;

    Order.getOrdersByDate(storeId, date, (err, orders) => {
        if (err) {
            return res.status(500).send("Error retrieving orders for delivery.");
        }

        res.render('orderDisplay', {
            currentTime: new Date().toLocaleTimeString(),
            currentDate: new Date().toLocaleDateString(),
            storeId,
            orders,
        });
    });
};
