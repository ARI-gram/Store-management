// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Route to show the dashboard
router.get('/dashboard/:store_id', dashboardController.getDashboard);

module.exports = router;