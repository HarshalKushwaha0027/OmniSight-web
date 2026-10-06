const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    ticker: {
        type: String,
        required: true,
        uppercase: true,
    },
    name: {
        type: String,
        default: '',
    },
}, { timestamps: true });

// A user can only watch a given ticker once
WatchlistSchema.index({ userId: 1, ticker: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', WatchlistSchema);