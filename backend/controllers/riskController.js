const Insight = require('../models/Insight'); // Adjust the path if necessary
const axios = require('axios');

exports.generatePrediction = async (req, res) => {
    const { ticker } = req.body; 

    if (!ticker) {
        return res.status(400).json({ error: "Please provide a stock ticker symbol." });
    }

    try {
        // 1. Get the data from Python FIRST
        const pythonResponse = await axios.post('https://omnisight-ml-engine.onrender.com/predict', {
            ticker: ticker
        });
        
        // 2. NOW we can safely extract the data
        const data = pythonResponse.data; 

        // 3. Save it to MongoDB
        try {
            await Insight.create({
                ticker: ticker.toUpperCase(),
                riskScore: data.risk || 0,
                confidence: data.confidence || 0,
                category: data.category || "Unknown"
            });
        } catch (dbError) {
            console.error("Database Error - Could not save insight:", dbError.message);
        }
        
        // 4. Send ONE response back to React
        return res.status(200).json(data);

    } catch (error) {
        console.error("Error talking to Python:", error.message);
        return res.status(500).json({ error: "ML Engine is currently unavailable." });
    }
};


// --- MANUAL CALCULATOR CONTROLLER ---
exports.manualCalculation = async (req, res) => {
    const { marketVolatility, revenueGrowth } = req.body;

    if (!marketVolatility || !revenueGrowth) {
        return res.status(400).json({ error: "Please provide both volatility and revenue growth." });
    }

    try {
        // Send data to the NEW Python manual-predict route
        const pythonResponse = await axios.post('https://omnisight-ml-engine.onrender.com/manual-predict', {
            marketVolatility: Number(marketVolatility),
            revenueGrowth: Number(revenueGrowth)
        });

        res.status(200).json(pythonResponse.data);
    } catch (error) {
        console.error("Error with manual calculator:", error.message);
        res.status(500).json({ error: "Calculator is currently unavailable." });
    }
};

// --- LIVE AUTOCOMPLETE SEARCH ---
exports.searchTickers = async (req, res) => {
    const query = req.query.q;
    
    if (!query) {
        return res.json([]);
    }

    try {
        // Fetch real-time suggestions from Yahoo Finance
        const response = await axios.get(`https://query2.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=5&newsCount=0`);
        
        const quotes = response.data.quotes || [];
        
        // Filter out news and only keep Stocks, ETFs, and Crypto
        const suggestions = quotes
            .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'ETF')
            .map(q => ({
                ticker: q.symbol,
                name: q.shortname || q.longname || q.symbol // Fallback to symbol if name is missing
            }));

        res.status(200).json(suggestions);
    } catch (error) {
        console.error("Search API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch suggestions." });
    }
};

// --- NEW: FETCH RECENT INSIGHTS ---
exports.getRecentInsights = async (req, res) => {
    try {
        // Find all insights, sort by newest first (descending), and limit to 5
        const insights = await Insight.find().sort({ createdAt: -1 }).limit(5);
        res.status(200).json(insights);
    } catch (error) {
        console.error("Failed to fetch history:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};

// --- NEW: FETCH FULL HISTORY (Up to 100 records) ---
exports.getAllInsights = async (req, res) => {
    try {
        const insights = await Insight.find().sort({ createdAt: -1 }).limit(100);
        res.status(200).json(insights);
    } catch (error) {
        console.error("Failed to fetch full history:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};