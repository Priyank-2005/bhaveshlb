// backend/routes/inwardRoutes.js

const express = require('express');
const router = express.Router();
const { 
    createInwardEntry, 
    getInwardEntries, // <--- THIS MUST BE INCLUDED
    getInwardEntryDetails, 
    updateInwardEntry, 
    deleteInwardEntry
}= require('../controllers/inwardController');
const { protect } = require('../middleware/authMiddleware'); // Ensures user is logged in

router.route('/')
    .post(protect, createInwardEntry) // Create new entry
    .get(protect, getInwardEntries); // Get all entries (summary list)

router.route('/:id')
    .get(protect, getInwardEntryDetails) // Get single entry with line items
    .put(protect, updateInwardEntry) // Update is complex and omitted for now
    .delete(protect, deleteInwardEntry); // Delete entry

module.exports = router;