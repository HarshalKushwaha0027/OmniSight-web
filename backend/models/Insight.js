const mongoose = require('mongoose');
const cors = require('cors'); 
const insightSchema = new mongoose.Schema({
  // Note: Once you build a login system, you would add a userId field here!
  ticker: { 
    type: String, 
    required: true 
  },
  riskScore: { 
    type: Number, 
    required: true 
  },
  confidence: { 
    type: Number, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Insight', insightSchema);