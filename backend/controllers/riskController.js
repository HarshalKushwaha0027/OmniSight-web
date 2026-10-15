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

    // 1. Check cache first.
    // IMPORTANT: a cache hit skips the slow ML call, but we must still log
    // this as an Insight for the logged-in user — otherwise repeat searches
    // of the same ticker within the 10-min window never show up in their
    // Recent Risk Insights / History, even though a real search happened.
    const cached = predictionCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
        console.log(`[cache HIT] ${key} — returning cached result`);

        Insight.create({
            userId: req.user ? req.user._id : null,
            ticker: key,
            riskScore: cached.data.risk || 0,
            confidence: cached.data.confidence || 0,
            category: cached.data.category || "Unknown"
        }).catch(dbError => {
            console.error("Database Error - Could not save insight (cache hit):", dbError.message);
        });

        return res.status(200).json(cached.data);
    }

    // 2. Cache miss — call the Python ML engine
    try {
        console.log(`[cache MISS] ${key} — calling ML engine`);
        const pythonResponse = await axios.post(`${ML_ENGINE_URL}/predict`, { ticker: key });
        const data = pythonResponse.data;

        // 3. Save the risk insight (non-blocking).
        // req.user is only set if the request carried a valid token
        // (optionalAuth middleware) — guests still get a prediction, their
        // search just never shows up in anyone's "Recent Risk Insights".
        Insight.create({
            userId: req.user ? req.user._id : null,
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

// ─── Static fallback list ──────────────────────────────────────────────────────
// A small curated list of commonly searched tickers. Used when Yahoo Finance
// is slow, rate-limiting, or outright blocking this request (common on cloud
// hosting IPs — Yahoo's search endpoint is unofficial and treats datacenter
// traffic differently from residential traffic). This guarantees the search
// bar NEVER goes completely dead, even if the external API is down.
const POPULAR_TICKERS = [
    { ticker: "AAPL",  name: "Apple Inc." },
    { ticker: "MSFT",  name: "Microsoft Corporation" },
    { ticker: "GOOGL", name: "Alphabet Inc." },
    { ticker: "AMZN",  name: "Amazon.com, Inc." },
    { ticker: "TSLA",  name: "Tesla, Inc." },
    { ticker: "NVDA",  name: "NVIDIA Corporation" },
    { ticker: "META",  name: "Meta Platforms, Inc." },
    { ticker: "NFLX",  name: "Netflix, Inc." },
    { ticker: "AMD",   name: "Advanced Micro Devices, Inc." },
    { ticker: "INTC",  name: "Intel Corporation" },
    { ticker: "JPM",   name: "JPMorgan Chase & Co." },
    { ticker: "V",     name: "Visa Inc." },
    { ticker: "DIS",   name: "The Walt Disney Company" },
    { ticker: "BA",    name: "The Boeing Company" },
    { ticker: "KO",    name: "The Coca-Cola Company" },
    { ticker: "MS",    name: "Morgan Stanley" },
    { ticker: "BTC-USD", name: "Bitcoin USD" },
    { ticker: "ETH-USD", name: "Ethereum USD" },
];

function searchStaticFallback(query) {
    const q = query.toLowerCase();
    return POPULAR_TICKERS.filter(
        (t) => t.ticker.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    ).slice(0, 5);
}

// ─── Search result cache ────────────────────────────────────────────────────
// Short TTL — autocomplete results don't need to be fresh-to-the-second,
// and this dramatically cuts how often Yahoo is hit for popular prefixes
// (every keystroke of "AAPL" would otherwise be 4 separate external calls).
const searchCache = new Map();
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Live Autocomplete Search ──────────────────────────────────────────────────
exports.searchTickers = async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    const cacheKey = query.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
        return res.status(200).json(cached.data);
    }

    try {
        const response = await axios.get(
            `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5&newsCount=0`,
            {
                timeout: 4000, // fail fast — don't make the user wait more than 4s for autocomplete
                headers: {
                    // A browser-like User-Agent reduces (does not eliminate) the chance
                    // Yahoo's endpoint flags this as bot/scraper traffic.
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
                    Accept: "application/json",
                },
            }
        );

        const quotes = response.data.quotes || [];
        const suggestions = quotes
            .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'ETF')
            .map(q => ({
                ticker: q.symbol,
                name: q.shortname || q.longname || q.symbol
            }));

        // Cache even an empty result — prevents hammering Yahoo for a query
        // that's known to return nothing useful.
        searchCache.set(cacheKey, { data: suggestions, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS });

        res.status(200).json(suggestions);

    } catch (error) {
        console.error("Search API Error:", error.message);
        // Yahoo failed/timed out/rate-limited — fall back to the static list
        // instead of returning an error. The search bar stays usable for
        // well-known tickers even when the external API is unreliable.
        const fallback = searchStaticFallback(query);
        res.status(200).json(fallback);
    }
};

// ─── Recent Insights (last 5) — SCOPED TO THE LOGGED-IN USER ──────────────────
// Requires auth: this is personal history, not a global feed.
exports.getRecentInsights = async (req, res) => {
    try {
        const insights = await Insight.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5);
        // Personal, frequently-changing data — never let the browser cache this.
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.status(200).json(insights);
    } catch (error) {
        console.error("Failed to fetch history:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};

// ─── Full History (up to 100) — SCOPED TO THE LOGGED-IN USER ──────────────────
exports.getAllInsights = async (req, res) => {
    try {
        const insights = await Insight.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(100);
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
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