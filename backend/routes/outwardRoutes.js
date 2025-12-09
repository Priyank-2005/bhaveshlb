// backend/routes/outwardRoutes.js

const express = require('express');
const router = express.Router();
const { 
    createOutwardEntry, getOutwardEntries, getOutwardEntryDetails, updateOutwardEntry,deleteOutwardEntry
} = require('../controllers/outwardController');
const { protect } = require('../middleware/authMiddleware'); // Security middleware

router.route('/')
    .post(protect, createOutwardEntry) // Create new entry
    .get(protect, getOutwardEntries); // Get all entries (summary list)

router.route('/:id')
    .get(protect, getOutwardEntryDetails) // Get single entry with line items
    .put(protect, updateOutwardEntry) //
    .delete(protect, deleteOutwardEntry); // Delete entry

module.exports = router;