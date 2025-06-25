const { calculateLeaderboard } = require('../services/leaderboardService');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await calculateLeaderboard();
    res.json(leaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getLeaderboard
};