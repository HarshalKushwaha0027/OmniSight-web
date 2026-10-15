const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

// The ML Ticker Route — optionalAuth reads the token if present and sets
// req.user, but never blocks guests. This was imported above but never
// actually attached here, which is why every Insight kept saving with
// userId: null regardless of login state.
router.post('/predict', optionalAuth, riskController.generatePrediction);

// Manual calculator
router.post('/manual-predict', riskController.manualCalculation);

// Search
router.get('/search', riskController.searchTickers);

// Insight history
router.get('/History', requireAuth, riskController.getRecentInsights);
router.get('/History/all', requireAuth, riskController.getAllInsights);

// Model experiment tracking
router.get('/experiments', requireAuth, riskController.getExperiments);
router.get('/experiments/:ticker', requireAuth, riskController.getExperimentsByTicker);

module.exports = router;