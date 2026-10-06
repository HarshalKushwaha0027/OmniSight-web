const User = require('../models/User');
const Watchlist = require('../models/Watchlist');
const jwt = require('jsonwebtoken');

function signToken(user) {
    return jwt.sign(
        { id: user._id, userId: user.userId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
}

function sanitizeUser(user) {
    return {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        createdAt: user.createdAt,
    };
}

// ─── POST /api/auth/register ───────────────────────────────────────────────
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const user = await User.create({ name, email, password });
        const token = signToken(user);

        return res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (error) {
        console.error('Register error:', error.message);
        return res.status(500).json({ error: 'Could not create account.' });
    }
};

// ─── POST /api/auth/login ──────────────────────────────────────────────────
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // .select('+password') because the schema hides it by default
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = signToken(user);
        return res.status(200).json({ token, user: sanitizeUser(user) });
    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({ error: 'Could not log in.' });
    }
};

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
// Protected — returns the current logged-in user (req.user set by middleware)
exports.getMe = async (req, res) => {
    return res.status(200).json({ user: sanitizeUser(req.user) });
};

// ─── PUT /api/auth/password ─────────────────────────────────────────────────
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Both current and new password are required.' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    try {
        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        user.password = newPassword;   // pre-save hook re-hashes it
        await user.save();

        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Password update error:', error.message);
        return res.status(500).json({ error: 'Could not update password.' });
    }
};

// ─── PUT /api/auth/preferences ───────────────────────────────────────────────
// Powers the Settings page
exports.updatePreferences = async (req, res) => {
    const allowedKeys = ['theme', 'defaultTicker', 'riskAlertThreshold', 'emailNotifications', 'defaultModel'];
    const updates = {};

    for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
            updates[`preferences.${key}`] = req.body[key];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid preference fields provided.' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        );
        return res.status(200).json({ user: sanitizeUser(user) });
    } catch (error) {
        console.error('Preferences update error:', error.message);
        return res.status(500).json({ error: 'Could not update preferences.' });
    }
};

// ─── PUT /api/auth/profile ───────────────────────────────────────────────────
// Update name (email changes are usually a bigger flow — kept simple here)
exports.updateProfile = async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty.' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name: name.trim() },
            { new: true, runValidators: true }
        );
        return res.status(200).json({ user: sanitizeUser(user) });
    } catch (error) {
        console.error('Profile update error:', error.message);
        return res.status(500).json({ error: 'Could not update profile.' });
    }
};

// ─── DELETE /api/auth/account ────────────────────────────────────────────────
// Requires the user to type their userId as confirmation (checked client-side
// too, but we also verify server-side to be safe)
exports.deleteAccount = async (req, res) => {
    const { confirmUserId } = req.body;

    if (confirmUserId !== req.user.userId) {
        return res.status(400).json({ error: 'Confirmation ID does not match.' });
    }

    try {
        await Watchlist.deleteMany({ userId: req.user._id });
        await User.findByIdAndDelete(req.user._id);
        return res.status(200).json({ message: 'Account deleted successfully.' });
    } catch (error) {
        console.error('Delete account error:', error.message);
        return res.status(500).json({ error: 'Could not delete account.' });
    }
};