const express = require('express');

const router = express.Router();

const {
    getAllDestinations,
    getDestinationById
} = require('../controllers/destinationController');

// GET /api/destinations
router.get('/', getAllDestinations);

// GET /api/destinations/:id
router.get('/:id', getDestinationById);

module.exports = router;