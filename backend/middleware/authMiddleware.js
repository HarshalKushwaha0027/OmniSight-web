const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protects a route — requires a valid "Authorization: Bearer <token>" header.
// On success, attaches the full user document (minus password) to req.user.
exports.requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ error: 'User no longer exists.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
};

// Like requireAuth, but never blocks the request. If a valid token is
// present, req.user is set; otherwise req.user stays undefined and the
// request continues as a guest. Used on routes that work for everyone
// (like /predict) but should personalize their result when logged in.
exports.optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) req.user = user;
    } catch (error) {
        // Invalid/expired token on an optional route — just proceed as a guest
    }

    next();
};