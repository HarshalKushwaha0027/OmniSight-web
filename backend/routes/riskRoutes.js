const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');


// The ML Ticker Route (We built this earlier)
router.post('/predict', riskController.generatePrediction);

// THE NEW MANUAL ROUTE
router.post('/manual-predict', riskController.manualCalculation);

// THE NEW SEARCH ROUTE
router.get('/search', riskController.searchTickers);

// Add this under your other routes
router.get('/History', riskController.getRecentInsights);

// Add this under your other routes
router.get('/History/all', riskController.getAllInsights); // NEW: For the full page

module.exports = router;