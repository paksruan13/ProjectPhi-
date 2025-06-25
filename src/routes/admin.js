const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticationToken, requireRole } = require('../middleware/auth');

// User management
router.get('/users', authenticationToken, requireRole(['ADMIN']), adminController.getAllUsers);
router.put('/users/:id', authenticationToken, requireRole(['ADMIN']), adminController.updateUser);

// Team management
router.get('/teams', authenticationToken, requireRole(['ADMIN']), adminController.getAllTeams);
router.post('/teams', authenticationToken, requireRole(['ADMIN']), adminController.createTeam);
router.put('/teams/:id', authenticationToken, requireRole(['ADMIN']), adminController.updateTeam);

// Coach management
router.get('/coaches', authenticationToken, requireRole(['ADMIN']), adminController.getCoaches);

// Activity management
router.get('/activity-categories', authenticationToken, requireRole(['ADMIN']), adminController.getActivityCategories);
router.post('/activity-categories', authenticationToken, requireRole(['ADMIN']), adminController.createActivityCategory);
router.get('/activities', authenticationToken, requireRole(['ADMIN']), adminController.getAllActivities);
router.post('/activities', authenticationToken, requireRole(['ADMIN']), adminController.createActivity);
router.put('/activities/:id', authenticationToken, requireRole(['ADMIN']), adminController.updateActivity);

module.exports = router;