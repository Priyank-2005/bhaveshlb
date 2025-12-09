// backend/routes/mastersRoutes.js

const express = require('express');
const router = express.Router();
const { 
    createParty, getParties, updateParty, deleteParty,
    createItem, getItems, updateItem, deleteItem,
    getInventoryStock
} = require('../controllers/mastersController');
const { protect } = require('../middleware/authMiddleware');

// --- Party Ledger Routes ---
// protect middleware ensures only logged-in users can access these routes
router.route('/party')
    .post(protect, createParty) // Add (Create)
    .get(protect, getParties); // Read (Fetch all)

router.route('/party/:id')
    .put(protect, updateParty) // Edit (Update)
    .delete(protect, deleteParty); // Delete

// --- Item/Product Routes ---
router.route('/item')
    .post(protect, createItem) // Add (Create)
    .get(protect, getItems); // Read (Fetch all)

router.route('/item/:id')
    .put(protect, updateItem) // Edit (Update)
    .delete(protect, deleteItem); // Delete

router.get('/inventory', protect, getInventoryStock);

module.exports = router;