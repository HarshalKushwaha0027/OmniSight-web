const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://omni-sight-web.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// ─── ROUTES ──────────────────────────────────────────────────────────────────
const riskRoutes = require('./routes/riskRoutes');
app.use('/api', riskRoutes);

app.get('/', (req, res) => {
    res.send('OmniSight Backend Server is running successfully!');
});

// ─── HEALTH CHECK (used by keep-alive ping) ───────────────────────────────────
// Render and the ML service both need a /health endpoint to stay warm
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// ─── KEEP-ALIVE: ping the ML service every 14 minutes ────────────────────────
// Render free tier spins down after 15 min of inactivity.
// This prevents the 30-60s cold-start lag your users experience.
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://your-ml-service.onrender.com';

const keepAlive = () => {
    const http = require('https');
    const req = http.get(`${ML_SERVICE_URL}/health`, (res) => {
        console.log(`[keep-alive] ML service ping: ${res.statusCode}`);
    });
    req.on('error', (err) => {
        console.warn(`[keep-alive] ML service ping failed: ${err.message}`);
    });
    req.end();
};

// Start pinging after 30s (give server time to boot), then every 14 min
setTimeout(() => {
    keepAlive(); // ping once at startup
    setInterval(keepAlive, 14 * 60 * 1000); // then every 14 min
}, 30_000);

// ─── MONGODB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI, { family: 4 })
    .then(() => console.log('Successfully connected to MongoDB!'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});