const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticationToken } = require('../middleware/auth');

router.get('/', teamController.getAllTeams);
router.get('/:id/score', teamController.getTeamScore);
router.post('/', authenticationToken, teamController.createTeam);

module.exports = router;