const userService = require('../services/userService');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');

const createUser = async (req, res) => {
  const { name, email, teamId } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }

  try {
    const userData = {
      name,
      email,
      team: teamId ? { connect: { id: teamId } } : undefined
    };
    
    const user = await userService.createUser(userData);
    
    if (teamId) {
      await emitLeaderboardUpdate(req.app.get('io'));
    }
    
    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createUser,
  getAllUsers
};