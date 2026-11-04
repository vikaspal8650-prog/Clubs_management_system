const express = require('express');
const router = express.Router();
const { login, register, logout, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/register', register);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

module.exports = router;
