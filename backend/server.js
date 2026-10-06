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

// ─── Simple in-memory cache (predictions) ─────────────────────────────────────
const CACHE_TTL_MS = 10 * 60 * 1000;
const predictionCache = new Map();
app.set('predictionCache', predictionCache);
app.set('CACHE_TTL_MS', CACHE_TTL_MS);

// ─── Routes ───────────────────────────────────────────────────────────────────
const riskRoutes = require('./routes/riskRoutes');
const authRoutes = require('./routes/authRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');

app.use('/api', riskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);

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
});