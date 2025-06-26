const { prisma } = require('../config/database');

const getAllTeams = async () => {
  return await prisma.team.findMany({
    include: {
      coach: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { members: true, donations: true, shirtSales: true, photos: true },
      }
    },
    orderBy: { name: 'desc' }
  });
};

const getTeamScore = async (teamId) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      donations: { select: { amount: true } },
      shirtSales: { select: { quantity: true } },
    },
  });

  if (!team) return null;

  const donationSum = team.donations.reduce((sum, d) => sum + d.amount, 0);
  const shirtPoints = team.shirtSales.reduce((sum, s) => sum + s.quantity, 0);
  
  return {
    teamId,
    score: donationSum + shirtPoints
  };
};

const createTeam = async (teamData) => {
  return await prisma.team.create({
    data: teamData,
  });
};

const createTeamWithCode = async (teamData) => {
  const generateTeamCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  let teamCode;
  let isUnique = false;
  while (!isUnique) {
    teamCode = generateTeamCode();
    const existingTeam = await prisma.team.findUnique({ where: { teamCode } });
    if (!existingTeam) {
      isUnique = true;
    }
  }

  return await prisma.team.create({
    data: {
      ...teamData,
      teamCode
    },
    include: {
      coach: {
        select: { id: true, name: true, email: true },
      }
    }
  });
};

const updateTeam = async (teamId, updateData) => {
  return await prisma.team.update({
    where: { id: teamId },
    data: updateData,
    include: {
      coach: {
        select: { id: true, name: true, email: true },
      },
      members: {
        select: { id: true, name: true, email: true, role: true },
      }
    }
  });
};

const getTeamsWithDetails = async () => {
  return await prisma.team.findMany({
    include: {
      members: {
        select: { id: true, name: true, email: true, role: true },
      },
      coach: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: {
          members: true,
          donations: true,
          shirtSales: true,
          photos: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findTeamByCode = async (teamCode) => {
  return await prisma.team.findUnique({
    where: { teamCode },
    select: { id: true, name: true, isActive: true },
  });
};

module.exports = {
  getAllTeams,
  getTeamScore,
  createTeam,
  createTeamWithCode,
  updateTeam,
  getTeamsWithDetails,
  findTeamByCode
};