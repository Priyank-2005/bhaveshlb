// backend/routes/outwardRoutes.js

const express = require('express');
const router = express.Router();
const {
  createOutwardEntry,
  getOutwardEntries,
  getOutwardEntryDetails,
  updateOutwardEntry,
  deleteOutwardEntry
} = require('../controllers/outwardController');

const { protect } = require('../middleware/authMiddleware');

// All routes protected
router.route('/')
  .post(protect, createOutwardEntry)
  .get(protect, getOutwardEntries);

router.route('/:id')
  .get(protect, getOutwardEntryDetails)
  .put(protect, updateOutwardEntry)
  .delete(protect, deleteOutwardEntry);

module.exports = router;
