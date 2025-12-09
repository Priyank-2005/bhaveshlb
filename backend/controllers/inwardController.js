// backend/controllers/inwardController.js

const db = require('../db'); 

/**
 * CREATE INWARD ENTRY: Header + Line Items + Stock Update
 * Method: POST /api/inward
 */
exports.createInwardEntry = async (req, res) => {
    // Destructure header and line item data
    const { inward_date, party_id, entry_type, line_items } = req.body; 

    if (!inward_date || !party_id || !line_items || line_items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields: date, party, and at least one item.' });
    }

    const connection = await db.getConnection(); 

    try {
        await connection.beginTransaction();

        // 1. Insert into inward_entries (Header)
        const [headerResult] = await connection.execute(
            'INSERT INTO inward_entries (inward_date, party_id, entry_type) VALUES (?, ?, ?)',
            [inward_date, party_id, entry_type] 
        );
        const entry_id = headerResult.insertId;

        // 2. Prepare and Insert line items (Lot/Godown included)
        // NOTE: we intentionally DO NOT include unit_of_measure here (column removed)
        const lineItemValues = line_items.map(item => [
            entry_id,
            item.item_id,
            item.quantity,
            item.lot_no || null,
            item.godown_no || null
        ]);

        // Bulk insert - specify only the columns we are inserting
        await connection.query(
            'INSERT INTO inward_line_items (entry_id, item_id, quantity, lot_no, godown_no) VALUES ?',
            [lineItemValues]
        );

        // 3. Update Stock Balance 
        for (const item of line_items) {
            const { item_id, quantity } = item;
            
            const updateStockQuery = `
                INSERT INTO inventory_stock (item_id, quantity)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity);
            `;
            await connection.execute(updateStockQuery, [item_id, quantity]);
        }

        await connection.commit();
        res.status(201).json({ 
            message: 'Inward entry created and stock updated successfully.',
            entry_id
        });

    } catch (error) {
        await connection.rollback();
        console.error('Create Inward Entry Error:', error);
        res.status(500).json({ message: 'Server error while creating inward entry.' });
    } finally {
        connection.release();
    }
};

/**
 * GET ALL INWARD ENTRIES (Summary View for table list)
 * Method: GET /api/inward
 */
exports.getInwardEntries = async (req, res) => {
    try {
        const query = `
            SELECT 
                i.entry_id, 
                i.inward_date AS date, 
                p.name AS party_name,
                l.item_id,
                m.item_name AS item_name,
                l.quantity,
                l.lot_no,
                l.godown_no,
                i.created_at AS entry_time
            FROM inward_entries i
            JOIN party_ledger p ON i.party_id = p.party_id
            JOIN inward_line_items l ON i.entry_id = l.entry_id
            JOIN item_master m ON l.item_id = m.item_id
            ORDER BY i.inward_date DESC, i.entry_id DESC
        `;
        const [entries] = await db.execute(query);
        res.json(entries);
    } catch (error) {
        console.error('Get Inward Entries Error:', error);
        res.status(500).json({ message: 'Server error while fetching entries.' });
    }
};

/**
 * GET SINGLE INWARD ENTRY WITH DETAILS
 * Method: GET /api/inward/:id
 */
exports.getInwardEntryDetails = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Fetch Header Details
        const [header] = await db.execute(
            'SELECT i.*, p.name as party_name FROM inward_entries i JOIN party_ledger p ON i.party_id = p.party_id WHERE i.entry_id = ?',
            [id]
        );

        if (header.length === 0) {
            return res.status(404).json({ message: 'Inward entry not found.' });
        }

        // 2. Fetch Line Items
        // Select explicit columns instead of SELECT l.* for clarity
        const [lineItems] = await db.execute(
            `SELECT l.line_item_id, l.entry_id, l.item_id, m.item_name, l.quantity, l.lot_no, l.godown_no
             FROM inward_line_items l
             JOIN item_master m ON l.item_id = m.item_id
             WHERE l.entry_id = ?`,
            [id]
        );
        
        res.json({
            ...header[0],
            line_items: lineItems
        });

    } catch (error) {
        console.error('Get Entry Details Error:', error);
        res.status(500).json({ message: 'Server error while fetching entry details.' });
    }
};


/**
 * DELETE INWARD ENTRY (Line items are deleted via CASCADE in DDL)
 * Method: DELETE /api/inward/:id
 */
exports.deleteInwardEntry = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.execute('DELETE FROM inward_entries WHERE entry_id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Inward entry not found.' });
        }
        res.json({ message: 'Inward entry and its line items deleted successfully.' });
    } catch (error) {
        console.error('Delete Entry Error:', error);
        res.status(500).json({ message: 'Server error while deleting entry.' });
    }
};

exports.updateInwardEntry = async (req, res) => {
    const { id } = req.params;
    const { inward_date, party_id, entry_type, line_items } = req.body;

    if (!inward_date || !party_id || !line_items || line_items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields for update.' });
    }

    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. REVERSE STOCK & DELETE OLD LINE ITEMS (Crucial for integrity)
        
        // 1a. Fetch old line items and quantities
        const [oldItems] = await connection.execute(
            'SELECT item_id, quantity FROM inward_line_items WHERE entry_id = ?',
            [id]
        );

        // 1b. Reverse the inventory impact of the old entry
        for (const item of oldItems) {
            const reverseStockQuery = `
                UPDATE inventory_stock
                SET quantity = quantity - ?
                WHERE item_id = ?;
            `;
            await connection.execute(reverseStockQuery, [item.quantity, item.item_id]);
        }

        // 1c. Delete all old line items associated with this entry
        await connection.execute('DELETE FROM inward_line_items WHERE entry_id = ?', [id]);


        // 2. UPDATE THE ENTRY HEADER
        await connection.execute(
            'UPDATE inward_entries SET inward_date = ?, party_id = ?, entry_type = ? WHERE entry_id = ?',
            [inward_date, party_id, entry_type, id]
        );
        

        // 3. INSERT NEW LINE ITEMS (as if it were a new entry)
        // NOTE: we intentionally DO NOT include unit_of_measure here
        const lineItemValues = line_items.map(item => [
            id,
            item.item_id,
            item.quantity,
            item.lot_no || null,
            item.godown_no || null
        ]);

        await connection.query(
            'INSERT INTO inward_line_items (entry_id, item_id, quantity, lot_no, godown_no) VALUES ?',
            [lineItemValues]
        );

        // 4. APPLY NEW STOCK IMPACT (Update stock based on new line items)
        for (const item of line_items) {
            const updateStockQuery = `
                INSERT INTO inventory_stock (item_id, quantity)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity);
            `;
            await connection.execute(updateStockQuery, [item.item_id, item.quantity]);
        }

        await connection.commit();
        res.status(200).json({ message: 'Inward entry and stock updated successfully.' });

    } catch (error) {
        await connection.rollback();
        console.error('Update Inward Entry Error:', error);
        res.status(500).json({ message: 'Server error during entry update.' });
    } finally {
        connection.release();
    }
};
