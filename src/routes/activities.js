const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticationToken } = require('../middleware/auth');

router.get('/', authenticationToken, activityController.getActivities);

module.exports = router;