const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// Public
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);

// Protected (require a valid token)
router.get('/me', requireAuth, authController.getMe);
router.put('/password', requireAuth, authController.updatePassword);
router.put('/preferences', requireAuth, authController.updatePreferences);
router.put('/profile', requireAuth, authController.updateProfile);
router.delete('/account', requireAuth, authController.deleteAccount);

module.exports = router;