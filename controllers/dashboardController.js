// Import required modules
const { Pool } = require('pg');
const moment = require('moment');
const pool = require('../db'); // Ensure this points to your configured PostgreSQL pool instance

// Export the getDashboard function
exports.getDashboard = async (req, res) => {
    const { user } = req.session; // Get user info from session
    const storeId = req.params.store_id;

    // Check if the user is authenticated
    if (!user) {
        return res.status(401).send({ message: 'Unauthorized. Please log in again.' });
    }

    // Check if the store ID is provided
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

    // Queries for fetching store and inventory data
    const storeQuery = 'SELECT * FROM stores WHERE store_id = $1;';
    const inventoryQuery = 'SELECT item, quantity FROM inventory WHERE store_id = $1;';

    try {
        // Fetch store details
        const storeResult = await pool.query(storeQuery, [storeId]);

        if (storeResult.rows.length === 0) {
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

        const store = storeResult.rows[0];

        // Fetch inventory details
        const inventoryResult = await pool.query(inventoryQuery, [storeId]);
        const inventory = inventoryResult.rows;

        // Render dashboard with store and inventory data
        return res.render('dashboard', {
            user,
            store,
            storeId,
            inventory,
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        return res.status(500).send({ message: 'An error occurred while fetching data.' });
    }
};
exports.searchData = async (req, res) => {
    const { user } = req.session;
    const storeId = req.params.store_id;
    const { query, table } = req.query;

    if (!user) {
        return res.status(401).send({ message: 'Unauthorized. Please log in again.' });
    }

    if (!storeId) {
        return res.status(400).send({ message: 'Store ID is required.' });
    }

    if (!query || !table) {
        return res.status(400).send({ message: 'Search query and table are required.' });
    }

    const validTables = ['inventory', 'deliveries', 'orders', 'utilize'];
    if (!validTables.includes(table)) {
        return res.status(400).send({ message: 'Invalid table selected.' });
    }

    try {
        const sqlQuery = `
            SELECT * 
            FROM ${table} 
            WHERE store_id = $1 AND (
                CAST(id AS TEXT) ILIKE $2 OR
                code ILIKE $2 OR
                item ILIKE $2 OR
                description ILIKE $2
            )
        `;
        const values = [storeId, `%${query}%`];
        const { rows } = await pool.query(sqlQuery, values);

        res.render('searchResults', { results: rows, table, storeId, user });
    } catch (error) {
        console.error('Error executing search query:', error);
        res.status(500).send({ message: 'Internal Server Error.' });
    }
};

