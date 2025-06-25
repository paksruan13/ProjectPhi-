const teamService = require('../services/teamService');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');

const getAllTeams = async (req, res) => {
  try {
    const teams = await teamService.getAllTeams();
    res.json(teams);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: err.message });
  }
};

const getTeamScore = async (req, res) => {
  const { id } = req.params;
  try {
    const score = await teamService.getTeamScore(id);
    if (!score) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTeam = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const team = await teamService.createTeam({ name });
    await emitLeaderboardUpdate(req.app.get('io'));
    res.status(201).json(team);
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllTeams,
  getTeamScore,
  createTeam
};