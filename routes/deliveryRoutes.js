// deliveries route file
const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');

// Route for displaying deliveries for a specific store
router.get('/:storeId', deliveryController.displayDeliveries);

// Route for creating a delivery for a specific store
router.post('/:storeId/add', deliveryController.createDelivery);

// Route to render the Deliver page
router.get('/:storeId/deliver', deliveryController.renderDeliverPage);

/// Render the Edit Delivery Form
router.get('/:storeId/edit/:deliveryId', deliveryController.editDelivery);

// Handle Form Submission for Updating a Delivery
router.post('/:storeId/edit/:deliveryId', deliveryController.updateDelivery);

// Route to delete a delivery
router.get('/:storeId/delete/:deliveryId', deliveryController.deleteDelivery);

// Route to get approved stores
router.get('/stores/approved', deliveryController.getApprovedStores);

router.get("/inventory/:storeId/item", deliveryController.getItemByCode);
module.exports = router;
