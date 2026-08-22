const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://omni-sight-web.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// ─── Simple in-memory cache ───────────────────────────────────────────────────
// Stores the last ML result for each ticker so repeat searches are instant.
// Cache entries expire after 10 minutes (the market data doesn't change faster).
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const predictionCache = new Map(); // Map<ticker, { data, expiresAt }>
 

// ─── Routes ───────────────────────────────────────────────────────────────────
const riskRoutes = require('./routes/riskRoutes');
app.use('/api', riskRoutes);

app.get('/', (req, res) => {
  res.send('OmniSight Backend Server is running successfully!');
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, { family: 4 })
  .then(() => console.log('Successfully connected to MongoDB!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startKeepAlive();
});

// ─── Keep-alive: ping this server every 14 minutes ───────────────────────────
// Render free tier spins down after 15 min of inactivity.
// This self-ping prevents that, eliminating the 30-60s cold-start delay.
function startKeepAlive() {
  const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

  setInterval(async () => {
    try {
      // Use native fetch (Node 18+) or fall back to http
      if (typeof fetch !== 'undefined') {
        await fetch(`${SELF_URL}/`);
      } else {
        const http = require('http');
        http.get(`${SELF_URL}/`);
      }
      console.log('[keep-alive] ping sent');
    } catch (err) {
      console.warn('[keep-alive] ping failed:', err.message);
    }
  }, INTERVAL_MS);
}