// routes/logoutRoute.js
const express = require('express');
const router = express.Router();

router.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).send('Error logging out.');
        }
        // Redirect to the root route ('/')
        res.redirect('/');
    });
});

module.exports = router;
