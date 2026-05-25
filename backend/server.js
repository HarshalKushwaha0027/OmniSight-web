const express = require('express');
const cors = require('cors'); 
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000',
        'https://your-live-frontend-url-goes-here.vercel.app' // <-- ADD THIS LINE!
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());    

// --- IMPORT ROUTES ---
const riskRoutes = require('./routes/riskRoutes');

// --- USE ROUTES ---
// This says: "Any URL that starts with /api should look inside riskRoutes"
app.use('/api', riskRoutes);

app.get('/', (req, res) => {
    res.send('OmniSight Backend Server is running successfully!');
});

mongoose.connect(process.env.MONGO_URI,{family: 4 
})
    .then(() => console.log('Successfully connected to MongoDB!'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});