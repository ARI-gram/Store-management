const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Get orders for a specific store
router.get('/:storeId/orders', orderController.getOrders);

// Create a new order
router.post('/:storeId/orders/add', orderController.createOrder);

// Edit an existing order (GET the order data for the form)
router.get('/:storeId/orders/edit/:orderId', orderController.editOrder);

// Update an existing order (POST the edited data)
router.post('/:storeId/orders/edit/:orderId', orderController.updateOrder);

// Delete an order
router.get('/:storeId/orders/delete/:orderId', orderController.deleteOrder);


router.get('/:storeId/order', orderController.getOrdersByDate);

module.exports = router;
