const nodemailer = require('nodemailer');

// Uses Gmail SMTP with an App Password (NOT your regular Gmail password).
// Setup: Google Account → Security → 2-Step Verification → App Passwords
// → generate one for "Mail" and put it in EMAIL_APP_PASSWORD below.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

function generateOtp() {
    // 6-digit numeric code, e.g. "042817"
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(to, otp, name) {
    const html = `
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

    await transporter.sendMail({
        from: `"OmniSight" <${process.env.EMAIL_USER}>`,
        to,
        subject: `${otp} is your OmniSight verification code`,
        html,
    });
}

module.exports = { generateOtp, sendOtpEmail };