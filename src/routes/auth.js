const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticationToken } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticationToken, authController.getCurrentUser);
router.post('/register-team', authController.registerWithTeam);
router.post('/join-team', authenticationToken, authController.joinTeam);

module.exports = router;