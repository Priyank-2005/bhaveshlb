// backend/controllers/outwardController.js

const db = require('../db');

/**
 * CREATE OUTWARD ENTRY: Header + Line Items (transactional)
 * Method: POST /api/outward
 */
exports.createOutwardEntry = async (req, res) => {
  const { outward_date, do_no, party_id, vehicle_no, line_items } = req.body;

  if (!outward_date || !do_no || !party_id || !line_items || line_items.length === 0) {
    return res.status(400).json({ message: 'Missing required fields: date, DO No, party, and at least one item.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Header
    const [headerResult] = await connection.execute(
      'INSERT INTO outward_entries (outward_date, do_no, party_id, vehicle_no) VALUES (?, ?, ?, ?)',
      [outward_date, do_no, party_id, vehicle_no]
    );
    const entry_id = headerResult.insertId;

    // 2. Prepare line items (NOTE: no unit_of_measure column)
    const lineItemValues = line_items.map(item => [
      entry_id,
      item.item_id,
      item.quantity,
      item.lot_no || null,
      item.godown_no || null
    ]);

    // Bulk insert - columns: entry_id, item_id, quantity, lot_no, godown_no
    await connection.query(
      'INSERT INTO outward_line_items (entry_id, item_id, quantity, lot_no, godown_no) VALUES ?',
      [lineItemValues]
    );

    // 3. Update stock (subtract quantities)
    for (const item of line_items) {
      const { item_id, quantity } = item;

      // Subtract quantity from inventory_stock (insert row or subtract)
      const updateStockQuery = `
        INSERT INTO inventory_stock (item_id, quantity)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity - VALUES(quantity);
      `;
      await connection.execute(updateStockQuery, [item_id, quantity]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Outward entry created successfully.', entry_id });
  } catch (error) {
    await connection.rollback();
    console.error('Create Outward Entry Error:', error);
    res.status(500).json({ message: 'Server error while creating outward entry.' });
  } finally {
    connection.release();
  }
};

/**
 * GET ALL OUTWARD ENTRIES (Summary)
 * Method: GET /api/outward
 */
exports.getOutwardEntries = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.entry_id,
        o.outward_date AS date,
        o.do_no,
        p.name AS party_name,
        o.vehicle_no,
        l.item_id,
        m.item_name AS item_name,
        l.quantity,
        l.lot_no,
        l.godown_no,
        o.created_at AS entry_time
      FROM outward_entries o
      JOIN party_ledger p ON o.party_id = p.party_id
      JOIN outward_line_items l ON o.entry_id = l.entry_id
      JOIN item_master m ON l.item_id = m.item_id
      ORDER BY o.outward_date DESC, o.entry_id DESC
    `;
    const [entries] = await db.execute(query);
    res.json(entries);
  } catch (error) {
    console.error('Get Outward Entries Error:', error);
    res.status(500).json({ message: 'Server error while fetching outward entries.' });
  }
};

/**
 * GET OUTWARD ENTRY DETAILS
 * Method: GET /api/outward/:id
 */
exports.getOutwardEntryDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const [header] = await db.execute(
      'SELECT o.*, p.name as party_name FROM outward_entries o JOIN party_ledger p ON o.party_id = p.party_id WHERE o.entry_id = ?',
      [id]
    );
    if (!header || header.length === 0) {
      return res.status(404).json({ message: 'Outward entry not found.' });
    }

    const [lineItems] = await db.execute(
      `SELECT l.line_item_id, l.entry_id, l.item_id, m.item_name, l.quantity, l.lot_no, l.godown_no
       FROM outward_line_items l
       JOIN item_master m ON l.item_id = m.item_id
       WHERE l.entry_id = ?`,
      [id]
    );

    res.json({
      ...header[0],
      line_items: lineItems
    });
  } catch (error) {
    console.error('Get Outward Entry Details Error:', error);
    res.status(500).json({ message: 'Server error while fetching outward entry details.' });
  }
};

/**
 * DELETE OUTWARD ENTRY
 * Method: DELETE /api/outward/:id
 */
exports.deleteOutwardEntry = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM outward_entries WHERE entry_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Outward entry not found.' });
    }
    res.json({ message: 'Outward entry and its line items deleted successfully.' });
  } catch (error) {
    console.error('Delete Outward Entry Error:', error);
    res.status(500).json({ message: 'Server error while deleting outward entry.' });
  }
};

/**
 * UPDATE OUTWARD ENTRY
 * Method: PUT /api/outward/:id
 */
exports.updateOutwardEntry = async (req, res) => {
  const { id } = req.params;
  const { outward_date, do_no, party_id, vehicle_no, line_items } = req.body;

  if (!outward_date || !do_no || !party_id || !line_items || line_items.length === 0) {
    return res.status(400).json({ message: 'Missing required fields for update.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch old line items (to reverse stock)
    const [oldItems] = await connection.execute(
      'SELECT item_id, quantity FROM outward_line_items WHERE entry_id = ?',
      [id]
    );

    // 2. Reverse the stock impact (outward originally subtracted, so add it back)
    for (const item of oldItems) {
      const reverseStockQuery = `
        UPDATE inventory_stock
        SET quantity = quantity + ?
        WHERE item_id = ?;
      `;
      await connection.execute(reverseStockQuery, [item.quantity, item.item_id]);
    }

    // 3. Delete old line items
    await connection.execute('DELETE FROM outward_line_items WHERE entry_id = ?', [id]);

    // 4. Update header
    await connection.execute(
      'UPDATE outward_entries SET outward_date = ?, do_no = ?, party_id = ?, vehicle_no = ? WHERE entry_id = ?',
      [outward_date, do_no, party_id, vehicle_no, id]
    );

    // 5. Insert new line items (no unit_of_measure)
    const lineItemValues = line_items.map(item => [
      id,
      item.item_id,
      item.quantity,
      item.lot_no || null,
      item.godown_no || null
    ]);
    await connection.query(
      'INSERT INTO outward_line_items (entry_id, item_id, quantity, lot_no, godown_no) VALUES ?',
      [lineItemValues]
    );

    // 6. Apply new stock impact (subtract new quantities)
    for (const item of line_items) {
      const updateStockQuery = `
        INSERT INTO inventory_stock (item_id, quantity)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity - VALUES(quantity);
      `;
      await connection.execute(updateStockQuery, [item.item_id, item.quantity]);
    }

    await connection.commit();
    res.status(200).json({ message: 'Outward entry and stock updated successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('Update Outward Entry Error:', error);
    res.status(500).json({ message: 'Server error during outward update.' });
  } finally {
    connection.release();
  }
};
