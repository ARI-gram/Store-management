const pool = require('../db');

// Show inventory for a specific store
exports.showInventory = async (req, res) => {
  const storeId = req.params.storeId;

  console.log("Fetching data for storeId:", storeId);

  if (!storeId) {
    console.error("Store ID is missing in request.");
    return res.status(400).send("Store ID is required.");
  }

  const query = "SELECT * FROM inventory WHERE store_id = $1";

  try {
    const result = await pool.query(query, [storeId]);
    console.log("Inventory data fetched:", result.rows);
    res.render('inventory', { inventory: result.rows, storeId: storeId });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).send("Failed to fetch inventory data.");
  }
};

// Add a new inventory item
exports.addInventory = async (req, res) => {
  const { code, item, description, quantity, units, dateIn } = req.body;
  const storeId = req.params.storeId;

  const query = `
    INSERT INTO inventory (code, item, description, quantity, units, date_in, store_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;

  try {
    await pool.query(query, [code, item, description, quantity, units, dateIn, storeId]);
    res.redirect(`/${storeId}/inventory`);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).send("Failed to add inventory item.");
  }
};

// Middleware to check admin role
const checkAdminRole = (req, res, next) => {
  const { user } = req.session; // Assuming user details are stored in the session after login
  if (!user || user.role !== 'admin') {
      return res.status(403).render('errorPage', { message: 'Access Denied. Admin privileges required.' });
  }
  next();
};

// Show edit form for an inventory item (Admin-only)
exports.editInventoryForm = [checkAdminRole, async (req, res) => {
  const storeId = req.params.storeId;
  const code = req.params.code;

  const query = "SELECT * FROM inventory WHERE store_id = $1 AND code = $2";

  try {
      const result = await pool.query(query, [storeId, code]);
      if (result.rows.length === 0) {
          return res.status(404).send("Item not found.");
      }
      res.render('editInventory', { item: result.rows[0], storeId });
  } catch (err) {
      console.error("Database error:", err);
      res.status(500).send("Failed to fetch inventory item.");
  }
}];

// Update an inventory item (Admin-only)
exports.updateInventory = [checkAdminRole, async (req, res) => {
  const storeId = req.params.storeId;
  const code = req.params.code;
  const { item, description, quantity, units, dateIn } = req.body;

  const query = `
      UPDATE inventory
      SET item = $1, description = $2, quantity = $3, units = $4, date_in = $5
      WHERE store_id = $6 AND code = $7
  `;

  try {
      await pool.query(query, [item, description, quantity, units, dateIn, storeId, code]);
      res.redirect(`/${storeId}/inventory`);
  } catch (err) {
      console.error("Database error:", err);
      res.status(500).send("Failed to update inventory item.");
  }
}];

// Delete an inventory item (Admin-only)
exports.deleteInventory = [checkAdminRole, async (req, res) => {
  const storeId = req.params.storeId;
  const code = req.params.code;

  const query = `
    DELETE FROM inventory 
    WHERE store_id = $1 AND code = $2
    RETURNING *;
  `;

  try {
      const result = await pool.query(query, [storeId, code]);

      if (result.rowCount === 0) {
          return res.status(404).send("Inventory item not found or already deleted.");
      }

      res.redirect(`/${storeId}/inventory`);
  } catch (err) {
      console.error("Database error:", err);
      res.status(500).send("Failed to delete inventory item.");
  }
}];

exports.utilizeInventoryForm = async (req, res) => {
  const storeId = req.params.storeId;
  const code = req.params.code;

  const query = "SELECT * FROM inventory WHERE store_id = $1 AND code = $2";

  try {
      const result = await pool.query(query, [storeId, code]);
      if (result.rows.length === 0) {
          return res.status(404).send("Item not found.");
      }
      res.render('utilize', { item: result.rows[0], storeId });
  } catch (err) {
      console.error("Database error:", err);
      res.status(500).send("Failed to fetch inventory item.");
  }
};

exports.utilizeInventory = async (req, res) => {
  const storeId = req.params.storeId;
  const code = req.params.code;
  const { quantity, units, comments } = req.body;

  // Start the transaction to ensure both operations succeed
  try {
    await pool.query('BEGIN');

    // First, insert the utilization record
    const insertUtilizeQuery = `
      INSERT INTO utilize (code, store_id, quantity, units, comments, date_utilized)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    await pool.query(insertUtilizeQuery, [code, storeId, quantity, units, comments]);

    // Next, update the inventory by deducting the utilized quantity
    const updateInventoryQuery = `
      UPDATE inventory
      SET quantity = quantity - $1
      WHERE store_id = $2 AND code = $3
    `;
    await pool.query(updateInventoryQuery, [quantity, storeId, code]);

    // Commit the transaction
    await pool.query('COMMIT');
    
    // Redirect to the inventory page after successful update
    res.redirect(`/${storeId}/inventory`);
  } catch (err) {
    console.error("Database error:", err);

    // Rollback the transaction if any error occurs
    await pool.query('ROLLBACK');

    // Send a server error message
    res.status(500).send("Failed to save utilization record and update inventory.");
  }
};

exports.showUtilizationReport = async (req, res) => {
  const storeId = req.params.storeId;

  const query = `
      SELECT 
          u.code, 
          i.item, 
          u.quantity, 
          u.units, 
          u.comments, 
          u.date_utilized 
      FROM utilize u
      JOIN inventory i ON u.code = i.code AND u.store_id = i.store_id
      WHERE u.store_id = $1
  `;

  try {
      const result = await pool.query(query, [storeId]);
      res.render('utilizeReport', { utilization: result.rows, storeId: storeId });
  } catch (err) {
      console.error("Database error:", err);
      res.status(500).send("Failed to fetch utilization records.");
  }
};

exports.editUtilizationForm = async (req, res) => {
  const { storeId, code } = req.params;

  const query = "SELECT * FROM utilize WHERE store_id = $1 AND code = $2";

  try {
      const result = await pool.query(query, [storeId, code]);
      if (result.rows.length === 0) {
          return res.status(404).send("Record not found.");
      }
      res.render('editUtilize', { record: result.rows[0], storeId });
  } catch (err) {
      console.error("Database error:", err);
      res.status(500).send("Failed to fetch utilization record.");
  }
};

exports.updateUtilization = async (req, res) => {
  const { storeId, code } = req.params;
  const { quantity, units, comments } = req.body;

  const query = `
      UPDATE utilize
      SET quantity = $1, units = $2, comments = $3, date_utilized = NOW()
      WHERE store_id = $4 AND code = $5
  `;

  try {
      await pool.query(query, [quantity, units, comments, storeId, code]);
      res.redirect(`/${storeId}/utilization`);
  } catch (err) {
      console.error("Database error:", err);
      res.status(500).send("Failed to update utilization record.");
  }
};

// Show Edit Utilization Form (Admin-only)
exports.editUtilizationForm = [checkAdminRole, async (req, res) => {
  const { storeId, code } = req.params;

  try {
      const query = `SELECT * FROM utilize WHERE store_id = $1 AND code = $2`;
      const result = await pool.query(query, [storeId, code]);

      if (result.rows.length === 0) {
          return res.status(404).send("Utilization record not found.");
      }

      res.render('editUtilization', { record: result.rows[0], storeId });
  } catch (err) {
      console.error('Error fetching utilization record:', err);
      res.status(500).send('Error fetching utilization record.');
  }
}];

// Update Utilization Record (Admin-only)
exports.updateUtilization = [checkAdminRole, async (req, res) => {
  const { storeId, code } = req.params;
  const { quantity, units, comments } = req.body;

  try {
      const query = `
          UPDATE utilize
          SET quantity = $1, units = $2, comments = $3, date_utilized = NOW()
          WHERE store_id = $4 AND code = $5
      `;
      await pool.query(query, [quantity, units, comments, storeId, code]);

      res.redirect(`/${storeId}/utilizeReport`);
  } catch (err) {
      console.error('Error updating utilization record:', err);
      res.status(500).send('Error updating utilization record.');
  }
}];

// Delete Utilization Record (Admin-only)
exports.deleteUtilization = [checkAdminRole, async (req, res) => {
  const { storeId, code } = req.params;

  try {
      const query = `DELETE FROM utilize WHERE store_id = $1 AND code = $2`;
      await pool.query(query, [storeId, code]);

      res.redirect(`/${storeId}/utilizeReport`);
  } catch (err) {
      console.error('Error deleting utilization record:', err);
      res.status(500).send('Error deleting utilization record.');
  }
}];
