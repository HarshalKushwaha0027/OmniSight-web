const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function generateUserId() {
    // e.g. USR-8F3A2C-91
    const part = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
    const suffix = Math.floor(10 + Math.random() * 89);
    return `USR-${part}-${suffix}`;
}

const UserSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        default: generateUserId,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        select: false,   // never returned by default queries
    },

    // ── Email verification (OTP) ───────────────────────────────────────────
    isVerified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
        select: false,
    },
    otpExpires: {
        type: Date,
        select: false,
    },

    // ── User preferences (Settings page) ──────────────────────────────────
    preferences: {
        theme: {
            type: String,
            enum: ['dark', 'light'],
            default: 'dark',
        },
        defaultTicker: {
            type: String,
            default: 'AAPL',
            uppercase: true,
        },
        riskAlertThreshold: {
            type: Number,
            default: 65,       // matches your High Risk cutoff
            min: 0,
            max: 100,
        },
        emailNotifications: {
            type: Boolean,
            default: true,
        },
        defaultModel: {
            type: String,
            enum: ['Auto', 'Logistic Regression', 'Random Forest', 'Gradient Boosting'],
            default: 'Auto',
        },
    },

}, { timestamps: true });

// Hash password before saving, only if it changed.
// IMPORTANT: this hook is async, so Mongoose does NOT pass a real `next`
// callback — it just awaits the returned promise. Declaring a `next` param
// here and calling it throws "next is not a function". Just return/await.
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Instance method to check a candidate password
UserSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
};
// Note: userId already has `unique: true` and `index: true` in its field
// definition above — no need to declare the index again here (that was
// causing the "Duplicate schema index" warning).

module.exports = mongoose.model('User', UserSchema);