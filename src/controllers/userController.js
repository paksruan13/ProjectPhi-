const userService = require('../services/userService');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');
const { prisma } = require('../config/database');

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
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: {
          select: { 
            id: true, 
            name: true, 
            teamCode: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: err.message });
  }
};

const getAllCoaches = async (req, res) => {
  try {
    const coaches = await prisma.user.findMany({
      where: { role: 'COACH' },
      select: {
        id: true, name: true, email: true,
        team: {
          select: { id: true, name: true, teamCode: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(coaches);
  } catch (err) {
    console.error('Error fetching coaches:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getAllCoaches
};