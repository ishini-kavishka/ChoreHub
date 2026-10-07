const express = require('express');
const { signUp, login, forgotPassword, resetPassword, logout } = require('../controllers/authController');
const { signInWithGoogle } = require('../controllers/googleAuthController');

const router = express.Router();
router.post('/signup', signUp);
router.post('/login', login);
router.post('/google', signInWithGoogle);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);

module.exports = router;
