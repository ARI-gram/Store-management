const { Pool } = require('pg');
const moment = require('moment');
const pool = require('../db');

exports.createDelivery = async (req, res) => {
    const {
        code, item, description, quantity, units, dateSent, timeSent,
        driver, authorization, vehicleNo, received, toStoreId
    } = req.body;

    const fromStoreId = req.session.storeId; // Automatically set fromStoreId from session

    try {
        // Check if the toStoreId exists in the stores table
        const storeQuery = 'SELECT * FROM stores WHERE store_id = $1';
        const storeResult = await pool.query(storeQuery, [toStoreId]);

        if (storeResult.rows.length === 0) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Store Not Found</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #f8d7da;
                        }
                        .message {
                            font-size: 1.5em;
                            color: #721c24;
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .button {
                            padding: 10px 20px;
                            font-size: 1em;
                            color: #fff;
                            background-color: #007bff;
                            border: none;
                            border-radius: 5px;
                            text-decoration: none;
                            cursor: pointer;
                        }
                        .button:hover {
                            background-color: #0056b3;
                        }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h1>Store Not Found</h1>
                        <p>The destination store with ID "${toStoreId}" does not exist.</p>
                    </div>
                    <a href="javascript:history.back()" class="button">Go Back</a>
                </body>
                </html>
            `);
        }

        // Check if the item exists in inventory for the source store
        const inventoryQuery = `
            SELECT * FROM inventory 
            WHERE code = $1 AND item = $2 AND store_id = $3
        `;
        const inventoryResult = await pool.query(inventoryQuery, [code, item, fromStoreId]);

        if (inventoryResult.rows.length === 0) {
            return res.status(404).send(`
                <div style="text-align: center; font-family: Arial;">
                    <h1>Not Found</h1>
                    <p>Item not found in the inventory for the current store.</p>
                </div>
            `);
        }

        const inventoryRow = inventoryResult.rows[0];

        // Check if sufficient quantity is available
        if (inventoryRow.quantity < quantity) {
            return res.status(400).send(`
                <div style="text-align: center; font-family: Arial, sans-serif; background-color: #f8d7da; padding: 30px; border-radius: 10px; border: 2px solid #f5c6cb; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                    <h1 style="color: #721c24; font-size: 36px; margin-bottom: 20px;">Insufficient Quantity</h1>
                    <p style="color: #721c24; font-size: 18px; line-height: 1.5; margin-bottom: 20px;">There is not enough quantity available in the inventory for this item.</p>
                    <div style="font-size: 20px; font-weight: bold; color: #721c24;">
                        <span>&#x26A0;</span> Please check the inventory or adjust the quantity.
                    </div>
                </div>
            `);
        }

        // Start a database transaction
        await pool.query('BEGIN');

        // Insert delivery record
        const deliveryQuery = `
            INSERT INTO deliveries (code, item, description, quantity, units, date_sent, time_sent, driver, "authorization", vehicle_no, from_store_id, to_store_id, received)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;
        await pool.query(deliveryQuery, [
            code, item, description, quantity, units, dateSent, timeSent, driver,
            authorization, vehicleNo, fromStoreId, toStoreId, received
        ]);

        // Reduce the quantity in the source store's inventory
        const updateInventoryQuery = `
            UPDATE inventory
            SET quantity = quantity - $1
            WHERE code = $2 AND item = $3 AND store_id = $4
        `;
        await pool.query(updateInventoryQuery, [quantity, code, item, fromStoreId]);

        // Commit the transaction
        await pool.query('COMMIT');
        res.redirect(`/deliveries/${fromStoreId}`);
    } catch (err) {
        console.error('Error during transaction:', err);

        // Rollback the transaction in case of any error
        await pool.query('ROLLBACK');

        res.status(500).send(`
            <div style="text-align: center; font-family: Arial, sans-serif; background-color: #f8d7da; padding: 30px; border-radius: 10px; border: 2px solid #f5c6cb; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #721c24; font-size: 36px; margin-bottom: 20px;">Error</h1>
                <p style="color: #721c24; font-size: 18px; line-height: 1.5; margin-bottom: 20px;">There was an error processing your request. Please try again later.</p>
                <div style="font-size: 20px; font-weight: bold; color: #721c24;">
                    <span>&#x26A0;</span> Something went wrong.
                </div>
            </div>
        `);
    }
};

  exports.displayDeliveries = async (req, res) => {
    const storeId = req.params.storeId;

    try {
        const query = 'SELECT * FROM deliveries WHERE from_store_id = $1';
        const result = await pool.query(query, [storeId]);

        res.render('delivery', { deliveries: result.rows, storeId });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving deliveries");
    }
};

exports.displayNewDeliveries = async (req, res) => {
  const storeId = req.params.storeId;

  try {
      const query = 'SELECT * FROM deliveries WHERE to_store_id = $1';
      const result = await pool.query(query, [storeId]);

      res.render('new_delivery', { deliveries: result.rows, storeId });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving new deliveries");
  }
};

exports.updateDeliveryStatus = async (req, res) => {
    const { deliveryId } = req.params;
    const { received } = req.body;

    try {
        // Step 1: Check if the delivery exists and status
        const checkQuery = 'SELECT * FROM deliveries WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [deliveryId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        const delivery = checkResult.rows[0];

        if (delivery.received === 'yes') {
            return res.status(400).json({ error: 'Delivery status cannot be updated again.' });
        }

        // Step 2: Update the delivery status
        const updateQuery = 'UPDATE deliveries SET received = $1 WHERE id = $2';
        await pool.query(updateQuery, [received, deliveryId]);

        // Step 3: If marked as 'yes', add to inventory
        if (received === 'yes') {
            const inventoryQuery = `
                INSERT INTO inventory (code, item, description, quantity, units, date_in, store_id)
                VALUES ($1, $2, $3, $4, $5, NOW(), $6)
                ON CONFLICT (code, store_id)
                DO UPDATE SET 
                    description = CONCAT(inventory.description, ', ', EXCLUDED.description),
                    quantity = inventory.quantity + EXCLUDED.quantity,
                    date_in = NOW()
            `;
        
            await pool.query(inventoryQuery, [
                delivery.code,
                delivery.item,
                delivery.description,
                delivery.quantity,
                delivery.units,
                delivery.to_store_id
            ]);
        
            console.log(`Delivery ${deliveryId} added/updated in inventory for store ${delivery.to_store_id}`);
        }     
        res.json({ message: 'Delivery status updated successfully and inventory updated.' });
    } catch (err) {
        console.error('Error updating delivery status or adding to inventory:', err);
        res.status(500).json({ error: 'Failed to update delivery status and inventory.' });
    }
};

// Render the Deliver page
exports.renderDeliverPage = (req, res) => {
    const storeId = req.params.storeId;
    const date = req.query.date;

    const query = "SELECT * FROM deliveries WHERE store_id = $1 AND date_sent = $2";
    pool.query(query, [storeId, date], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send(`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
                    <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                        <h1 style="color: #e74c3c;">Error</h1>
                        <p style="font-size: 18px; color: #555;">Error retrieving deliveries for the specified date.</p>
                        <a href="/" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">Go Back</a>
                    </div>
                </div>
            `);
        }

        res.render('deliver', {
            deliveries: result.rows,
            storeId,
            date,
            currentTime: moment().format("HH:mm"),
            currentDate: moment().format("YYYY-MM-DD"),
        });
    });
};
// Middleware to check admin role
const checkAdminRole = (req, res, next) => {
    const { user } = req.session; // Assuming user details are stored in the session after login
    if (!user || user.role !== 'admin') {
        return res.status(403).render('errorPage', { message: 'Access Denied. Admin privileges required.' });
    }
    next();
};

// ✅ Render the edit delivery form (Admin-only)
exports.editDelivery = [checkAdminRole, (req, res) => {
    const deliveryId = req.params.deliveryId;
    const storeId = req.params.storeId;

    const query = `SELECT * FROM deliveries WHERE id = $1 AND store_id = $2`;

    pool.query(query, [deliveryId, storeId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching delivery details");
        }

        if (result.rows.length === 0) {
            return res.status(404).send("Delivery not found");
        }

        res.render('editDeliveries', { delivery: result.rows[0], storeId });
    });
}];

// ✅ Update an existing delivery (Admin-only)
exports.updateDelivery = [checkAdminRole, (req, res) => {
    const deliveryId = req.params.deliveryId;
    const { code, item, description, quantity, units, dateSent, timeSent, driver, authorization, vehicleNo, received } = req.body;

    const query = `
        UPDATE deliveries
        SET code = $1, item = $2, description = $3, quantity = $4, units = $5, date_sent = $6, time_sent = $7, driver = $8, "authorization" = $9, vehicle_no = $10, received = $11
        WHERE id = $12
    `;

    pool.query(query, [code, item, description, quantity, units, dateSent, timeSent, driver, authorization, vehicleNo, received, deliveryId], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error updating delivery");
        }

        res.redirect(`/deliveries/${req.params.storeId}`);
    });
}];

// ✅ Delete a delivery (Admin-only)
exports.deleteDelivery = [checkAdminRole, (req, res) => {
    const deliveryId = req.params.deliveryId;

    const fetchQuery = "SELECT * FROM deliveries WHERE id = $1";
    pool.query(fetchQuery, [deliveryId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving delivery details");
        }

        if (result.rows.length === 0) {
            return res.status(404).send("Delivery not found");
        }

        const { code, item, quantity, store_id } = result.rows[0];

        const deleteQuery = "DELETE FROM deliveries WHERE id = $1";
        pool.query(deleteQuery, [deliveryId], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error deleting delivery");
            }

            const updateQuery = "UPDATE inventory SET quantity = quantity + $1 WHERE code = $2 AND item = $3 AND store_id = $4";
            pool.query(updateQuery, [quantity, code, item, store_id], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error updating inventory");
                }

                res.redirect(`/deliveries/${req.params.storeId}`);
            });
        });
    });
}];

// Get Approved Stores
exports.getApprovedStores = (req, res) => {
    const query = "SELECT email, store_id FROM users WHERE status = 'approved'";

    pool.query(query, [], (err, result) => {
        if (err) {
            console.error("Error fetching approved stores:", err);
            return res.status(500).json({ error: "Failed to fetch approved stores." });
        }

        res.json(result.rows);
    });
};

// Route to fetch inventory details by code
exports.getItemByCode = (req, res) => {
    const { code } = req.query;
    const storeId = req.params.storeId;

    const query = "SELECT * FROM inventory WHERE code = $1 AND store_id = $2";

    pool.query(query, [code, storeId], (err, result) => {
        if (err) {
            console.error("Error querying the inventory:", err);
            return res.status(500).json({ error: "Error querying the inventory." });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Item not found in inventory." });
        }

        res.json(result.rows[0]); // Send the item details as JSON
    });
};
