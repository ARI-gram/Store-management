const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const orderController = require('../controllers/orderController');
const ordersDirectory = path.join(__dirname, '../uploads/orders');

// Create directory if it doesn't exist
if (!fs.existsSync(ordersDirectory)) {
    fs.mkdirSync(ordersDirectory, { recursive: true });
}

// Route to display all orders
router.get('/:storeId/orders', orderController.displayOrders);

// Route to create a new order
router.post('/:storeId/orders/add', orderController.createOrder);

// Route to render the edit order form
router.get('/:storeId/orders/edit/:orderId', orderController.editOrder);

// Route to handle order updates
router.post('/:storeId/orders/edit/:orderId', orderController.updateOrder);

// Route to delete an order
router.get('/:storeId/orders/delete/:orderId', orderController.deleteOrder);

// Route to display orders based on a selected date
router.get('/:storeId/orders/search', orderController.searchOrdersByDate);

router.get('/:storeId/new-orders', orderController.displayNewOrders);

// Route to display the edit status form
router.get('/:storeId/edit-order/:orderId', orderController.editOrderStatus);

// Route to handle the status update
router.post('/orders/:orderId/update-status', orderController.updateOrderStatus);

module.exports = router;
