const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

// The ML Ticker Route
router.post('/predict', riskController.generatePrediction);

// Manual calculator
router.post('/manual-predict', riskController.manualCalculation);

// Search
router.get('/search', riskController.searchTickers);

// Insight history
router.get('/History', requireAuth, riskController.getRecentInsights);
router.get('/History/all', requireAuth, riskController.getAllInsights);

// NEW: Model experiment tracking
router.get('/experiments', requireAuth, riskController.getExperiments);
router.get('/experiments/:ticker', requireAuth, riskController.getExperimentsByTicker);

module.exports = router;