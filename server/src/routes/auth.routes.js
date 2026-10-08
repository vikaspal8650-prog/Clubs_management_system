const express = require('express');
const router = express.Router();
const { login, register, logout, me, switchRoleDemo } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.post('/switch-role', switchRoleDemo);
router.get('/me', authenticate, me);

module.exports = router;
