const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

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

module.exports = router;
