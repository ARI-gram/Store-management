const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Import the controller

// Define routes
router.post('/generate-otp', authController.generateOtp);
router.post('/verify-otp', authController.verifyOtp);
router.get('/admin', (req, res) => {
  res.render('admin'); 
});
router.post('/signup', authController.signup);
router.get('/pending-users', authController.getPendingUsers);
router.post('/approve-user', authController.approveUser);
router.get('/active-users', authController.getActiveUsers);
router.get('/edit-user/:email/:store_id', authController.renderEditUser);
router.post('/edit-user/:email/:store_id', authController.editUser);
router.post('/delete-user/:email/:store_id', authController.deleteUser);
router.get('/stores', authController.getStores);
router.get('/edit-store/:store_id', authController.renderEditStore);
router.post('/update-store/:store_id', authController.updateStore);
router.post('/delete-store/:store_id', authController.deleteStore);
router.get('/new-store', (req, res) => {
  const { email, store_id } = req.query;
  res.render('new-store', { email, store_id });
});
router.post('/create-store', authController.createStore);

module.exports = router;
