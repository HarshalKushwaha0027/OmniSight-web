const axios = require('axios');
const crypto = require('crypto');

// Render's free tier blocks outbound SMTP (ports 25/465/587), so nodemailer +
// Gmail times out in production. This sends through Brevo's HTTPS API instead,
// which works on any host.
//
// Required env vars (local .env AND Render):
//   BREVO_API_KEY   - Brevo → SMTP & API → API Keys
//   EMAIL_FROM      - a sender address you've verified in Brevo → Senders
// Optional:
//   EMAIL_FROM_NAME - defaults to "OmniSight"

function generateOtp() {
    // crypto.randomInt is cryptographically secure (Math.random is not)
    return crypto.randomInt(100000, 1000000).toString();
}

async function sendOtpEmail(to, otp, name) {
    if (!process.env.BREVO_API_KEY || !process.env.EMAIL_FROM) {
        throw new Error('Email is not configured: set BREVO_API_KEY and EMAIL_FROM.');
    }

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0e14; color: #e2e8f0;">
            <h2 style="color: #00AB55; margin-bottom: 8px;">OmniSight</h2>
            <p style="color: #94a3b8; margin-bottom: 24px;">Hi ${name}, verify your email to finish creating your account.</p>
            <div style="background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px;">Your verification code</p>
                <p style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0;">${otp}</p>
            </div>
            <p style="color: #64748b; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
    `;

    await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
            sender: {
                name: process.env.EMAIL_FROM_NAME || 'OmniSight',
                email: process.env.EMAIL_FROM,
            },
            to: [{ email: to, name }],
            subject: `${otp} is your OmniSight verification code`,
            htmlContent,
        },
        {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json',
                accept: 'application/json',
            },
            timeout: 10000, // fail fast (10s) instead of hanging for over a minute
        }
    );
}

module.exports = { generateOtp, sendOtpEmail };