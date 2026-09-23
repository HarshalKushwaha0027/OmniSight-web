const Insight = require('../models/Insight');
const Experiment = require('../models/Experiment');
const axios = require('axios');

const ML_ENGINE_URL = 'https://omnisight-ml-engine.onrender.com';

// ─── In-memory cache ──────────────────────────────────────────────────────────
const predictionCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── Generate Prediction (with cache + experiment logging) ───────────────────
exports.generatePrediction = async (req, res) => {
    const { ticker } = req.body;

    if (!ticker) {
        return res.status(400).json({ error: "Please provide a stock ticker symbol." });
    }

    const key = ticker.toUpperCase();

    // 1. Check cache first
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

        // 3. Save the risk insight (non-blocking)
        Insight.create({
            ticker: key,
            riskScore: data.risk || 0,
            confidence: data.confidence || 0,
            category: data.category || "Unknown"
        }).catch(dbError => {
            console.error("Database Error - Could not save insight:", dbError.message);
        });

        // 4. NEW: Save the full experiment (model comparison, best model, validation)
        // Non-blocking — a logging failure should never break the user's response.
        if (data.model_comparison && data.best_model) {
            Experiment.create({
                ticker: key,
                modelComparison: data.model_comparison,
                bestModel: data.best_model,
                topFeatures: (data.feature_importance || []).slice(0, 3).map(f => ({
                    feature: f.feature,
                    importance: f.importance,
                })),
                validation: data.validation ? {
                    method:      data.validation.method,
                    trainRows:   data.validation.train_rows,
                    testRows:    data.validation.test_rows,
                    trainPeriod: data.validation.train_period,
                    testPeriod:  data.validation.test_period,
                } : undefined,
                featureCount: (data.feature_importance || []).length || 11,
            }).catch(expError => {
                console.error("Database Error - Could not save experiment:", expError.message);
            });
        }

        // 5. Store result in cache
        predictionCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });

        return res.status(200).json(data);

    } catch (error) {
        console.error("Error talking to Python:", error.message);
        return res.status(500).json({ error: "ML Engine is currently unavailable." });
    }
};

// ─── Manual Calculator ────────────────────────────────────────────────────────
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

// ─── NEW: List recent experiments (for the Model Experiments page) ───────────
exports.getExperiments = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const experiments = await Experiment.find()
            .sort({ createdAt: -1 })
            .limit(limit);
        res.status(200).json(experiments);
    } catch (error) {
        console.error("Failed to fetch experiments:", error);
        res.status(500).json({ error: "Failed to fetch experiments" });
    }
};

// ─── NEW: Get experiments for one specific ticker ─────────────────────────────
exports.getExperimentsByTicker = async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();
        const experiments = await Experiment.find({ ticker })
            .sort({ createdAt: -1 })
            .limit(20);
        res.status(200).json(experiments);
    } catch (error) {
        console.error("Failed to fetch experiments for ticker:", error);
        res.status(500).json({ error: "Failed to fetch experiments" });
    }
};