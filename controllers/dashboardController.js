const db = require('../models/dashboard');

exports.getDashboard = (req, res) => {
    const { user } = req.session; // Get user info from session
    const storeId = req.params.store_id;

    if (!user) {
        return res.status(401).send({ message: 'Unauthorized. Please log in again.' });
    }

    if (!storeId) {
        return res.status(400).send({ message: 'Store ID is required.' });
    }

    console.log('Fetching data for store_id:', storeId, 'User:', user);

    // Role-based access control
    if (user.role !== 'admin' && user.storeId !== storeId) {
        return res.status(403).send({
            message: 'Access denied. You are not authorized to access this store.',
        });
    }

    const storeQuery = `SELECT * FROM stores WHERE store_id = ?;`;
    const inventoryQuery = `SELECT item, quantity FROM inventory WHERE store_id = ?;`;

    // Fetch store details
    db.get(storeQuery, [storeId], (err, store) => {
        if (err) {
            console.error('Error fetching store data:', err);
            return res.status(500).send({ message: 'Error fetching store data.' });
        }

        if (!store) {
            return res.status(404).send(`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
                    <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                        <h1 style="color: #e74c3c;">Error</h1>
                        <p style="font-size: 18px; color: #555;">Store not found.</p>
                        <a href="/" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">Go Back</a>
                    </div>
                </div>
            `);
        }

        // Fetch inventory details
        db.all(inventoryQuery, [storeId], (err, inventory) => {
            if (err) {
                console.error('Error fetching inventory data:', err);
                return res.status(500).send({ message: 'Error fetching inventory data.' });
            }

            // Render dashboard with store and inventory data
            return res.render('dashboard', {
                user,
                store,
                storeId,
                inventory,
            });
        });
    });
};
