const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Route to display inventory for a specific store
router.get('/:storeId/inventory', inventoryController.showInventory);

// Route to handle adding a new inventory item
router.post('/:storeId/inventory/add', inventoryController.addInventory);

// Route to show edit form
router.get('/:storeId/inventory/edit/:code', inventoryController.editInventoryForm);

// Route to handle editing an inventory item
router.post('/:storeId/inventory/edit/:code', inventoryController.updateInventory);

// Route to handle deleting an inventory item
router.get('/:storeId/inventory/delete/:code', inventoryController.deleteInventory);

module.exports = router;
