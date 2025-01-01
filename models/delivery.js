const pool = require('../db');

// Function to add a delivery
const addDelivery = async (delivery, callback) => {
    const {
        code,
        item,
        description,
        quantity,
        units,
        dateSent,
        timeSent,
        driver,
        authorization,
        vehicleNo,
        storeId,
        received
    } = delivery;

    try {
        // Start a transaction
        await pool.query('BEGIN');

        // Check if inventory has enough quantity
        const checkInventoryQuery = `SELECT * FROM inventory WHERE code = $1 AND item = $2 AND store_id = $3`;
        const inventoryResult = await pool.query(checkInventoryQuery, [code, item, storeId]);

        if (inventoryResult.rows.length === 0 || inventoryResult.rows[0].quantity < quantity) {
            throw new Error('Not enough stock in inventory.');
        }

        // Insert the delivery record into the deliveries table
        const insertDeliveryQuery = `
            INSERT INTO deliveries (code, item, description, quantity, units, date_sent, time_sent, driver, authorization, vehicle_no, store_id, received)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
        `;
        const deliveryResult = await pool.query(insertDeliveryQuery, [
            code, item, description, quantity, units, dateSent, timeSent, driver, authorization, vehicleNo, storeId, received
        ]);

        // Update inventory by subtracting the quantity delivered
        const updateInventoryQuery = `UPDATE inventory SET quantity = quantity - $1 WHERE code = $2 AND item = $3 AND store_id = $4`;
        await pool.query(updateInventoryQuery, [quantity, code, item, storeId]);

        // Commit the transaction
        await pool.query('COMMIT');

        callback(null, { id: deliveryResult.rows[0].id });
    } catch (err) {
        // Rollback the transaction in case of error
        await pool.query('ROLLBACK');
        callback(err);
    }
};

// Function to get deliveries for a specific store
const getDeliveriesByStoreId = async (storeId, callback) => {
    const query = `SELECT * FROM deliveries WHERE store_id = $1 ORDER BY date_sent DESC`;

    try {
        const result = await pool.query(query, [storeId]);
        callback(null, result.rows);
    } catch (err) {
        callback(err);
    }
};

module.exports = {
    addDelivery,
    getDeliveriesByStoreId
};
