// backend/controllers/mastersController.js

const db = require('../db'); 

// --- Party Ledger Controllers ---

exports.createParty = async (req, res) => {
    const { name, gst_no, email_id, contact_no, type } = req.body;
    
    if (!name || !type) {
        return res.status(400).json({ message: 'Name and Type are required fields.' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO party_ledger (name, gst_no, email_id, contact_no, type) VALUES (?, ?, ?, ?, ?)',
            [name, gst_no, email_id, contact_no, type]
        );
        res.status(201).json({ 
            message: 'Party added successfully.',
            party_id: result.insertId
        });
    } catch (error) {
        console.error('Create Party Error:', error);
        res.status(500).json({ message: 'Server error while creating party.' });
    }
};

exports.getParties = async (req, res) => {
    try {
        const [parties] = await db.execute('SELECT * FROM party_ledger ORDER BY name ASC');
        res.json(parties);
    } catch (error) {
        console.error('Get Parties Error:', error);
        res.status(500).json({ message: 'Server error while fetching parties.' });
    }
};

exports.updateParty = async (req, res) => {
    const { id } = req.params;
    const { name, gst_no, email_id, contact_no, type } = req.body;
    
    try {
        const [result] = await db.execute(
            'UPDATE party_ledger SET name = ?, gst_no = ?, email_id = ?, contact_no = ?, type = ? WHERE party_id = ?',
            [name, gst_no, email_id, contact_no, type, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Party not found.' });
        }
        res.json({ message: 'Party updated successfully.' });
    } catch (error) {
        console.error('Update Party Error:', error);
        res.status(500).json({ message: 'Server error while updating party.' });
    }
};

exports.deleteParty = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.execute('DELETE FROM party_ledger WHERE party_id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Party not found.' });
        }
        res.json({ message: 'Party deleted successfully.' });
    } catch (error) {
        console.error('Delete Party Error:', error);
        res.status(500).json({ message: 'Server error while deleting party.' });
    }
};


// --- Item Master Controllers ---

// NOTE: removed hsn_sac and unit_of_measure handling because those columns were dropped from DB

exports.createItem = async (req, res) => {
    const { item_name } = req.body;
    
    if (!item_name) {
        return res.status(400).json({ message: 'Item Name is a required field.' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO item_master (item_name) VALUES (?)',
            [item_name]
        );
        res.status(201).json({ 
            message: 'Item added successfully.',
            item_id: result.insertId
        });
    } catch (error) {
        // Handle unique constraint violation gracefully
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Item with this name already exists.' });
        }
        console.error('Create Item Error:', error);
        res.status(500).json({ message: 'Server error while creating item.' });
    }
};

exports.getItems = async (req, res) => {
    try {
        // select explicit columns instead of SELECT * to avoid referencing removed columns
        const [items] = await db.execute('SELECT item_id, item_name, created_at FROM item_master ORDER BY item_name ASC');
        res.json(items);
    } catch (error) {
        console.error('Get Items Error:', error);
        res.status(500).json({ message: 'Server error while fetching items.' });
    }
};

exports.updateItem = async (req, res) => {
    const { id } = req.params;
    const { item_name } = req.body;
    
    try {
        const [result] = await db.execute(
            'UPDATE item_master SET item_name = ? WHERE item_id = ?',
            [item_name, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }
        res.json({ message: 'Item updated successfully.' });
    } catch (error) {
        console.error('Update Item Error:', error);
        res.status(500).json({ message: 'Server error while updating item.' });
    }
};

exports.deleteItem = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.execute('DELETE FROM item_master WHERE item_id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }
        res.json({ message: 'Item deleted successfully.' });
    } catch (error) {
        console.error('Delete Item Error:', error);
        res.status(500).json({ message: 'Server error while deleting item.' });
    }
};

exports.getInventoryStock = async (req, res) => {
    try {
        const query = `
            WITH StockMovements AS (
                -- Total Inward Movements (Adds stock)
                SELECT 
                    l.item_id, 
                    m.item_name,
                    l.lot_no,
                    l.godown_no,
                    SUM(l.quantity) AS InQuantity,
                    0 AS OutQuantity
                FROM inward_line_items l
                JOIN item_master m ON l.item_id = m.item_id
                GROUP BY l.item_id, m.item_name, l.lot_no, l.godown_no

                UNION ALL

                -- Total Outward Movements (Subtracts stock)
                SELECT 
                    l.item_id, 
                    m.item_name,
                    l.lot_no,
                    l.godown_no,
                    0 AS InQuantity,
                    SUM(l.quantity) AS OutQuantity
                FROM outward_line_items l
                JOIN item_master m ON l.item_id = m.item_id
                GROUP BY l.item_id, m.item_name, l.lot_no, l.godown_no
            )
            -- Final Aggregation to calculate balance
            SELECT 
                item_id, 
                item_name, 
                lot_no, 
                godown_no,
                SUM(InQuantity) AS total_in,
                SUM(OutQuantity) AS total_out,
                (SUM(InQuantity) - SUM(OutQuantity)) AS current_stock
            FROM StockMovements
            GROUP BY item_id, item_name, lot_no, godown_no
            HAVING current_stock > 0
            ORDER BY item_name, godown_no;
        `;
        const [stock] = await db.execute(query);
        res.json(stock);
    } catch (error) {
        console.error('Get Inventory Stock Error:', error);
        res.status(500).json({ message: 'Server error while fetching inventory.' });
    }
};
