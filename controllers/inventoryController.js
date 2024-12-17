const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db'); // Ensure correct database path

exports.showInventory = (req, res) => {
  const storeId = req.params.storeId;

  console.log("Fetching data for storeId:", storeId);

  if (!storeId) {
    console.error("Store ID is missing in request.");
    return res.status(400).send("Store ID is required.");
  }

  const query = "SELECT * FROM inventory WHERE store_id = ?";
  db.all(query, [storeId], (err, rows) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Failed to fetch inventory data.");
    }
    console.log("Inventory data fetched:", rows);
    res.render('inventory', { inventory: rows, storeId: storeId });
  });
};

// Add a new inventory item
exports.addInventory = (req, res) => {
    const { code, item, description, quantity, units, dateIn } = req.body;
    const storeId = req.params.storeId; // Get storeId from the route parameters

    // SQL query to insert a new inventory item
    const query = `
        INSERT INTO inventory (code, item, description, quantity, units, date_in, store_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [code, item, description, quantity, units, dateIn, storeId], function(err) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Failed to add inventory item.");
        }
        // Redirect to the inventory page for the store
        res.redirect(`/${storeId}/inventory`);
    });
};

// Show edit form for an inventory item
exports.editInventoryForm = (req, res) => {
  const storeId = req.params.storeId;
  const code = req.params.code;

  const query = "SELECT * FROM inventory WHERE store_id = ? AND code = ?";
  db.get(query, [storeId, code], (err, item) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Failed to fetch inventory item.");
      }
      if (!item) {
          return res.status(404).send("Item not found.");
      }
      res.render('editInventory', { item, storeId });
  });
};

// Update an inventory item
exports.updateInventory = (req, res) => {
  const storeId = req.params.storeId;
  const code = req.params.code;
  const { item, description, quantity, units, dateIn } = req.body;

  const query = `
      UPDATE inventory
      SET item = ?, description = ?, quantity = ?, units = ?, date_in = ?
      WHERE store_id = ? AND code = ?
  `;

  db.run(query, [item, description, quantity, units, dateIn, storeId, code], function(err) {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Failed to update inventory item.");
      }
      res.redirect(`/${storeId}/inventory`);
  });
};

// Delete an inventory item
exports.deleteInventory = (req, res) => {
  const storeId = req.params.storeId;
  const code = req.params.code;

  const query = "DELETE FROM inventory WHERE store_id = ? AND code = ?";
  db.run(query, [storeId, code], function(err) {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Failed to delete inventory item.");
      }
      res.redirect(`/${storeId}/inventory`);
  });
};
