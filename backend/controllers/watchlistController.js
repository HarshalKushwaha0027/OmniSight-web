const Watchlist = require('../models/Watchlist');

// GET /api/watchlist
exports.getWatchlist = async (req, res) => {
    try {
        const items = await Watchlist.find({ userId: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json(items);
    } catch (error) {
        console.error('Get watchlist error:', error.message);
        return res.status(500).json({ error: 'Could not fetch watchlist.' });
    }
};

// POST /api/watchlist   { ticker, name }
exports.addToWatchlist = async (req, res) => {
    const { ticker, name } = req.body;
    if (!ticker) {
        return res.status(400).json({ error: 'Ticker is required.' });
    }

    try {
        const item = await Watchlist.create({
            userId: req.user._id,
            ticker: ticker.toUpperCase(),
            name: name || '',
        });
        return res.status(201).json(item);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'This ticker is already in your watchlist.' });
        }
        console.error('Add watchlist error:', error.message);
        return res.status(500).json({ error: 'Could not add to watchlist.' });
    }
};

// DELETE /api/watchlist/:ticker
exports.removeFromWatchlist = async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();
        await Watchlist.findOneAndDelete({ userId: req.user._id, ticker });
        return res.status(200).json({ message: 'Removed from watchlist.' });
    } catch (error) {
        console.error('Remove watchlist error:', error.message);
        return res.status(500).json({ error: 'Could not remove from watchlist.' });
    }
};