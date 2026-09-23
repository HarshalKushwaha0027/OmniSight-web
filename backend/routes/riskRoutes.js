const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');

// The ML Ticker Route
router.post('/predict', riskController.generatePrediction);

// Manual calculator
router.post('/manual-predict', riskController.manualCalculation);

// Search
router.get('/search', riskController.searchTickers);

// Insight history
router.get('/History', riskController.getRecentInsights);
router.get('/History/all', riskController.getAllInsights);

// NEW: Model experiment tracking
router.get('/experiments', riskController.getExperiments);
router.get('/experiments/:ticker', riskController.getExperimentsByTicker);

module.exports = router;