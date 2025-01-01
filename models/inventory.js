const pool = require('../db');

const Inventory = {
    getAllByStoreId(storeId) {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM inventory WHERE store_id = $1";
            pool.query(query, [storeId])
                .then((res) => resolve(res.rows))
                .catch((err) => reject(err));
        });
    },

    addItem({ code, item, description, quantity, units, date_in, store_id }) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO inventory (code, item, description, quantity, units, date_in, store_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;
            pool.query(query, [code, item, description, quantity, units, date_in, store_id])
                .then((res) => resolve(res.rows[0].id))
                .catch((err) => reject(err));
        });
    },
};

module.exports = Inventory;
