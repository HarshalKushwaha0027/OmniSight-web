const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema({
    // Optional: a logged-out guest search still gets saved (userId stays null),
    // but it will never show up in anyone's personal "Recent Risk Insights".
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    ticker: {
        type: String,
        required: true,
        uppercase: true,
    },
    riskScore: {
        type: Number,
        required: true,
    },
    confidence: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
}, { timestamps: true });

InsightSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Insight', InsightSchema);