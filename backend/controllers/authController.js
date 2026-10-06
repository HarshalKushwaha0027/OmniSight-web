const User = require('../models/User');
const Watchlist = require('../models/Watchlist');
const jwt = require('jsonwebtoken');
const { generateOtp, sendOtpEmail } = require('../utils/sendEmail');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

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
        isVerified: user.isVerified,
        preferences: user.preferences,
        createdAt: user.createdAt,
    };
}

// ─── POST /api/auth/register ───────────────────────────────────────────────
// Creates an UNVERIFIED account and emails a 6-digit OTP.
// Does NOT return a token yet — the frontend must call /verify-otp first.
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
        if (existing && existing.isVerified) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + OTP_TTL_MS);

        let user;
        if (existing && !existing.isVerified) {
            // Re-registering before verifying — update details and resend OTP
            existing.name = name;
            existing.password = password;   // pre-save hook re-hashes it
            existing.otp = otp;
            existing.otpExpires = otpExpires;
            user = await existing.save();
        } else {
            user = await User.create({ name, email, password, otp, otpExpires });
        }

        await sendOtpEmail(user.email, otp, user.name);

        return res.status(201).json({
            message: 'Verification code sent to your email.',
            email: user.email,
        });
    } catch (error) {
        console.error('Register error:', error.message);
        return res.status(500).json({ error: 'Could not create account.' });
    }
};

// ─── POST /api/auth/verify-otp ──────────────────────────────────────────────
// Body: { email, otp } → marks the account verified and logs them in.
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and code are required.' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpires');
        if (!user) {
            return res.status(404).json({ error: 'No account found for this email.' });
        }
        if (user.isVerified) {
            return res.status(400).json({ error: 'This account is already verified.' });
        }
        if (!user.otp || user.otp !== otp) {
            return res.status(400).json({ error: 'Incorrect verification code.' });
        }
        if (user.otpExpires < new Date()) {
            return res.status(400).json({ error: 'This code has expired. Request a new one.' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = signToken(user);
        return res.status(200).json({ token, user: sanitizeUser(user) });
    } catch (error) {
        console.error('Verify OTP error:', error.message);
        return res.status(500).json({ error: 'Could not verify code.' });
    }
};

// ─── POST /api/auth/resend-otp ──────────────────────────────────────────────
exports.resendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ error: 'No account found for this email.' });
        if (user.isVerified) return res.status(400).json({ error: 'This account is already verified.' });

        const otp = generateOtp();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
        await user.save();

        await sendOtpEmail(user.email, otp, user.name);
        return res.status(200).json({ message: 'A new code has been sent.' });
    } catch (error) {
        console.error('Resend OTP error:', error.message);
        return res.status(500).json({ error: 'Could not resend code.' });
    }
};

// ─── POST /api/auth/login ──────────────────────────────────────────────────
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        if (!user.isVerified) {
            // Help the user along — resend a code automatically
            const otp = generateOtp();
            user.otp = otp;
            user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
            await user.save();
            await sendOtpEmail(user.email, otp, user.name);

            return res.status(403).json({
                error: 'Please verify your email first. A new code has been sent.',
                needsVerification: true,
                email: user.email,
            });
        }

        const token = signToken(user);
        return res.status(200).json({ token, user: sanitizeUser(user) });
    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({ error: 'Could not log in.' });
    }
};

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
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

        user.password = newPassword;
        await user.save();

        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Password update error:', error.message);
        return res.status(500).json({ error: 'Could not update password.' });
    }
};

// ─── PUT /api/auth/preferences ───────────────────────────────────────────────
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