const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db'); // Path to your SQLite database
const moment = require('moment');

exports.createDelivery = (req, res) => {
    const { code, item, description, quantity, units, dateSent, timeSent, driver, authorization, vehicleNo, received, fromStoreId, toStoreId } = req.body;
    const storeId = req.params.storeId; // Get storeId from URL parameters

    db.get("SELECT * FROM inventory WHERE code = ? AND item = ? AND store_id = ?", [code, item, storeId], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).send(`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
                    <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                        <h1 style="color: #e74c3c;">Error</h1>
                        <p style="font-size: 18px; color: #555;">Error querying the inventory. Please try again later.</p>
                        <a href="/" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">Go Back</a>
                    </div>
                </div>
            `);
        }

        if (!row) {
            return res.status(404).send(`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
                    <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                        <h1 style="color: #e74c3c;">Not Found</h1>
                        <p style="font-size: 18px; color: #555;">Item not found in the inventory.</p>
                        <a href="/" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">Go Back</a>
                    </div>
                </div>
            `);
        }

        if (row.quantity < quantity) {
            return res.status(400).send(`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
                    <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                        <h1 style="color: #e74c3c;">Insufficient Quantity</h1>
                        <p style="font-size: 18px; color: #555;">Not enough quantity available in inventory.</p>
                        <a href="/" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">Go Back</a>
                    </div>
                </div>
            `);
        }

        const query = `
            INSERT INTO deliveries (code, item, description, quantity, units, date_sent, time_sent, driver, authorization, vehicle_no, store_id, from_store_id, to_store_id, received)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(query, [code, item, description, quantity, units, dateSent, timeSent, driver, authorization, vehicleNo, storeId, fromStoreId, toStoreId, received], function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send(`
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
                        <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                            <h1 style="color: #e74c3c;">Error</h1>
                            <p style="font-size: 18px; color: #555;">Error inserting delivery record. Please try again later.</p>
                            <a href="/" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">Go Back</a>
                        </div>
                    </div>
                `);
            }

            const updateQuery = "UPDATE inventory SET quantity = quantity - ? WHERE code = ? AND item = ? AND store_id = ?";
            db.run(updateQuery, [quantity, code, item, storeId], function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).send(`
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
                            <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                                <h1 style="color: #e74c3c;">Error</h1>
                                <p style="font-size: 18px; color: #555;">Error updating inventory. Please try again later.</p>
                                <a href="/" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">Go Back</a>
                            </div>
                        </div>
                    `);
                }

                res.send(`
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
                        <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                            <h1 style="color: #2ecc71;">Success</h1>
                            <p style="font-size: 18px; color: #555;">Delivery record created and inventory updated successfully.</p>
                            <a href="/deliveries/${storeId}" style="margin-top: 20px; display: inline-block; text-decoration: none; color: #fff; background-color: #3498db; padding: 10px 20px; border-radius: 5px;">View Deliveries</a>
                        </div>
                    </div>
                `);
            });
        });
    });
};

exports.displayDeliveries = (req, res) => {
    const storeId = req.params.storeId; // Get storeId from URL parameters

    const query = "SELECT * FROM deliveries WHERE store_id = ?";
    db.all(query, [storeId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving deliveries");
        }

        res.render('delivery', { deliveries: rows, storeId });
    });
};
// Render the Deliver page
exports.renderDeliverPage = (req, res) => {
    const storeId = req.params.storeId;
    const date = req.query.date;

    const query = "SELECT * FROM deliveries WHERE store_id = ? AND date_sent = ?";
    db.all(query, [storeId, date], (err, rows) => {
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

        console.log('Fetched deliveries:', rows);

        res.render('deliver', {
            deliveries: rows,
            storeId,
            date,
            currentTime: moment().format("HH:mm"),
            currentDate: moment().format("YYYY-MM-DD"),
        });
    });
};

exports.editDelivery = (req, res) => {
    const deliveryId = req.params.deliveryId;
    const storeId = req.params.storeId;

    const query = `SELECT * FROM deliveries WHERE id = ? AND store_id = ?`;

    db.get(query, [deliveryId, storeId], (err, delivery) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching delivery details");
        }

        if (!delivery) {
            return res.status(404).send("Delivery not found");
        }

        res.render('editDeliveries', { delivery, storeId });
    });
};

exports.updateDelivery = (req, res) => {
    const deliveryId = req.params.deliveryId;
    const { code, item, description, quantity, units, dateSent, timeSent, driver, authorization, vehicleNo, received } = req.body;

    const query = `
        UPDATE deliveries
        SET code = ?, item = ?, description = ?, quantity = ?, units = ?, date_sent = ?, time_sent = ?, driver = ?, authorization = ?, vehicle_no = ?, received = ?
        WHERE id = ?
    `;

    db.run(query, [code, item, description, quantity, units, dateSent, timeSent, driver, authorization, vehicleNo, received, deliveryId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send("Error updating delivery");
        }

        res.redirect(`/deliveries/${req.params.storeId}`);
    });
};

// Delete delivery
exports.deleteDelivery = (req, res) => {
    const deliveryId = req.params.deliveryId; // Get deliveryId from URL parameters

    // First, fetch the delivery details to update the inventory
    const fetchQuery = "SELECT * FROM deliveries WHERE id = ?";
    db.get(fetchQuery, [deliveryId], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving delivery details");
        }

        if (!row) {
            return res.status(404).send("Delivery not found");
        }

        const { code, item, quantity, store_id } = row;

        // Query to delete the delivery
        const deleteQuery = "DELETE FROM deliveries WHERE id = ?";
        db.run(deleteQuery, [deliveryId], function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send("Error deleting delivery");
            }

            // Update the inventory to restore the quantity
            const updateQuery = "UPDATE inventory SET quantity = quantity + ? WHERE code = ? AND item = ? AND store_id = ?";
            db.run(updateQuery, [quantity, code, item, store_id], function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error updating inventory");
                }

                res.redirect(`/deliveries/${req.params.storeId}`);
            });
        });
    });
};
exports.getApprovedStores = (req, res) => {
    const query = "SELECT email, store_id FROM users WHERE status = 'approved'";

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching approved stores:", err);
            return res.status(500).json({ error: "Failed to fetch approved stores." });
        }

        res.json(rows);
    });
};

