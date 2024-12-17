const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db'); // Adjust to your DB path

exports.searchResults = (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.render('searchdisplay', { results: [], message: 'No search term provided' });
    }

    const sqlStatements = [
        `SELECT 'inventory' AS source, id, code, item AS name, description, store_id, quantity, date_in AS date FROM inventory WHERE item LIKE ? OR description LIKE ?`,
        `SELECT 'deliveries' AS source, id, code, item AS name, description, store_id, quantity, date_sent AS date FROM deliveries WHERE item LIKE ? OR description LIKE ?`,
        `SELECT 'orders' AS source, id, code, item_name AS name, description, store_id, quantity, date_ordered AS date FROM orders WHERE item_name LIKE ? OR description LIKE ?`,
        `SELECT 'users' AS source, email AS id, store_id, role AS name, status AS description, '' AS quantity, '' AS date FROM users WHERE email LIKE ? OR role LIKE ?`,
        `SELECT 'stores' AS source, store_id AS id, email AS code, created_at AS date, '' AS name, '' AS description, '' AS quantity FROM stores WHERE store_id LIKE ? OR email LIKE ?`
    ];

    const placeholders = [`%${query}%`, `%${query}%`];
    let combinedResults = [];

    let queriesCompleted = 0;

    sqlStatements.forEach((sql) => {
        db.all(sql, placeholders, (err, rows) => {
            if (err) {
                console.error('Error executing query:', err);
            } else {
                combinedResults = combinedResults.concat(rows);
            }
            queriesCompleted++;

            if (queriesCompleted === sqlStatements.length) {
                res.render('searchdisplay', { results: combinedResults, message: '' });
            }
        });
    });
};

