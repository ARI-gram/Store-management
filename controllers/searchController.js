const db = require('../db');

exports.searchResults = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.render('searchdisplay', { results: [], message: 'No search term provided' });
    }

    const searchQuery = `%${query}%`;

    const sqlStatements = [
        `SELECT 'inventory' AS source, id, code, item AS name, description, store_id, quantity, date_in AS date 
         FROM inventory WHERE item ILIKE $1 OR description ILIKE $1`,
        `SELECT 'deliveries' AS source, id, code, item AS name, description, store_id, quantity, date_sent AS date 
         FROM deliveries WHERE item ILIKE $1 OR description ILIKE $1`,
        `SELECT 'orders' AS source, id, code, item_name AS name, description, store_id, quantity, date_ordered AS date 
         FROM orders WHERE item_name ILIKE $1 OR description ILIKE $1`,
        `SELECT 'users' AS source, email AS id, store_id, role AS name, status AS description, '' AS quantity, '' AS date 
         FROM users WHERE email ILIKE $1 OR role ILIKE $1`,
        `SELECT 'stores' AS source, store_id AS id, email AS code, created_at AS date, '' AS name, '' AS description, '' AS quantity 
         FROM stores WHERE store_id ILIKE $1 OR email ILIKE $1`
    ];

    try {
        const results = await Promise.all(
            sqlStatements.map((sql) =>
                db.query(sql, [searchQuery]).then((res) => res.rows)
            )
        );

        // Flatten the results array into a single array of rows
        const combinedResults = results.flat();

        res.render('searchdisplay', { results: combinedResults, message: '' });
    } catch (err) {
        console.error('Error executing queries:', err);
        res.status(500).send('Error retrieving search results.');
    }
};
