const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlistController');
const { requireAuth } = require('../middleware/authMiddleware');

// All watchlist routes require login
router.get('/', requireAuth, watchlistController.getWatchlist);
router.post('/', requireAuth, watchlistController.addToWatchlist);
router.delete('/:ticker', requireAuth, watchlistController.removeFromWatchlist);

module.exports = router;