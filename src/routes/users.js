const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticationToken, requireRole } = require('../middleware/auth');

router.post('/', userController.createUser);
router.get('/', authenticationToken, requireRole(['ADMIN']),userController.getAllUsers);
router.get('/coaches', authenticationToken, requireRole(['ADMIN']), userController.getAllCoaches);

module.exports = router;