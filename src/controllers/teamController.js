const teamService = require('../services/teamService');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');
const { prisma } = require('../config/database');

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
    const team = await teamService.createTeamWithCode({
      name,
      coachId: coachId || null,
    });
    await emitLeaderboardUpdate(req.app.get('io'));
    res.status(201).json(team);
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ error: err.message });
  }
};

const assignCoach = async (req, res) => {
  try {
    const {teamId} = req.params;
    const {coachId} = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const currentTeam = await tx.team.findUnique({
        where: { id: teamId },
        select: { coachId: true }
      });

      if(currentTeam?.coachId) {
        await tx.user.update({
          where: { id: currentTeam.coachId },
          data: { teamId: null }
        });
      }

      const updatedTeam = await tx.team.update({
        where:{ id: teamId },
        data: { coachId: coachId || null },
        include: {
          coach: {select: { id: true, name: true, email: true } },
        }
      });

      if( coachId) {
        await tx.user.update({
          where: { id: coachId },
          data: { teamId: teamId }
        });
      }

      return updatedTeam;
    });

    res.json({
      message: 'Coach assigned successfully',
      team: result
    });
  } catch (err) {
    console.error('Error assigning coach:', err);
    res.status(500).json({ error: 'Failed to assign coach' });
  }
};

const getAdminTeams = async(req, res) => {
  try {
    const teams = await teamService.getTeamsWithDetails();
    res.json(teams);
  } catch (err) {
    console.error('Error fetching teams for admin:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateAdminTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, coachId, isActive } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      const currentTeam = await tx.team.findUnique({
        where: { id },
        select: { coachId: true }
      });
      
      if (currentTeam?.coachId) {
        await tx.user.update({
          where: { id: currentTeam.coachId },
          data: { teamId: null }
        });
      }

      // ADD THE MISSING PARTS
      const updatedTeam = await tx.team.update({
        where: { id },
        data: { 
          name, 
          coachId: coachId || null, 
          isActive: isActive !== undefined ? isActive : true
        },
        include: {
          coach: {
            select: { id: true, name: true, email: true }
          },
          members: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      });

      if (coachId) {
        await tx.user.update({
          where: { id: coachId },
          data: { teamId: id }
        });
      }

      return updatedTeam;
    }); 

    res.json({
      message: 'Team updated successfully',
      team: result
    });
  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ error: 'Failed to update team' });
  }
};

module.exports = {
  getAllTeams,
  getTeamScore,
  createTeam,
  assignCoach,
  updateAdminTeam,
  getAdminTeams
};