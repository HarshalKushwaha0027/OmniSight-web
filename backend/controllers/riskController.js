const Insight = require('../models/Insight');
const axios = require('axios');

const ML_ENGINE_URL = 'https://omnisight-ml-engine.onrender.com';

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Stores ML results per ticker for 10 minutes so repeat searches are instant.
const predictionCache = new Map(); // Map<ticker, { data, expiresAt }>
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── Generate Prediction (with cache) ────────────────────────────────────────
exports.generatePrediction = async (req, res) => {
    const { ticker } = req.body;

    if (!ticker) {
        return res.status(400).json({ error: "Please provide a stock ticker symbol." });
    }

    const key = ticker.toUpperCase();

    // 1. Check cache first — return instantly if we have a fresh result
    const cached = predictionCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
        console.log(`[cache HIT] ${key} — returning cached result`);
        return res.status(200).json(cached.data);
    }

    // 2. Cache miss — call the Python ML engine
    try {
        console.log(`[cache MISS] ${key} — calling ML engine`);
        const pythonResponse = await axios.post(`${ML_ENGINE_URL}/predict`, { ticker: key });
        const data = pythonResponse.data;

        // 3. Save to MongoDB (non-blocking — don't let a DB error stop the response)
        Insight.create({
            ticker: key,
            riskScore: data.risk || 0,
            confidence: data.confidence || 0,
            category: data.category || "Unknown"
        }).catch(dbError => {
            console.error("Database Error - Could not save insight:", dbError.message);
        });

        // 4. Store result in cache
        predictionCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });

        return res.status(200).json(data);

    } catch (error) {
        console.error("Error talking to Python:", error.message);
        return res.status(500).json({ error: "ML Engine is currently unavailable." });
    }
};

// ─── Manual Calculator ────────────────────────────────────────────────────────
// No cache needed here — this is a fast pure calculation on the Python side.
exports.manualCalculation = async (req, res) => {
    const { marketVolatility, revenueGrowth } = req.body;

    if (marketVolatility == null || revenueGrowth == null) {
        return res.status(400).json({ error: "Please provide both volatility and revenue growth." });
    }

    try {
        const pythonResponse = await axios.post(`${ML_ENGINE_URL}/manual-predict`, {
            marketVolatility: Number(marketVolatility),
            revenueGrowth: Number(revenueGrowth)
        });
        res.status(200).json(pythonResponse.data);
    } catch (error) {
        console.error("Error with manual calculator:", error.message);
        res.status(500).json({ error: "Calculator is currently unavailable." });
    }
};

// ─── Live Autocomplete Search ──────────────────────────────────────────────────
exports.searchTickers = async (req, res) => {
    const query = req.query.q;

    if (!query) return res.json([]);

    try {
        const response = await axios.get(
            `https://query2.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=5&newsCount=0`
        );
        const quotes = response.data.quotes || [];

        const suggestions = quotes
            .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'ETF')
            .map(q => ({
                ticker: q.symbol,
                name: q.shortname || q.longname || q.symbol
            }));

        res.status(200).json(suggestions);
    } catch (error) {
        console.error("Search API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch suggestions." });
    }
};

// ─── Recent Insights (last 5) ─────────────────────────────────────────────────
exports.getRecentInsights = async (req, res) => {
    try {
        const insights = await Insight.find().sort({ createdAt: -1 }).limit(5);
        res.status(200).json(insights);
    } catch (error) {
        console.error("Failed to fetch history:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};

// ─── Full History (up to 100) ─────────────────────────────────────────────────
exports.getAllInsights = async (req, res) => {
    try {
        const insights = await Insight.find().sort({ createdAt: -1 }).limit(100);
        res.status(200).json(insights);
    } catch (error) {
        console.error("Failed to fetch full history:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};