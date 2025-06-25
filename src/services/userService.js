const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

const createUser = async (userData) => {
  return await prisma.user.create({
    data: userData,
    include: { team: { select: { id: true, name: true } } },
  });
};

const getAllUsers = async () => {
  return await prisma.user.findMany({
    include: { team: { select: { id: true, name: true } } },
  });
};

const getUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      team: {
        select: { id: true, name: true, teamCode: true }
      },
      coachedTeams: {
        select: { id: true, name: true, teamCode: true }
      }
    }
  });
};

const getUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
    include: { team: true, coachedTeams: true }
  });
};

const createUserWithHash = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  return await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      team: { select: { id: true, name: true } },
    }
  });
};

const updateUser = async (userId, updateData) => {
  return await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: {
      team: { select: { id: true, name: true, teamCode: true } },
    }
  });
};

const getAllUsersWithDetails = async () => {
  return await prisma.user.findMany({
    include: {
      team: { select: { id: true, name: true, teamCode: true } },
      coachedTeams: { select: { id: true, name: true, teamCode: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getCoaches = async () => {
  return await prisma.user.findMany({
    where: { role: 'COACH', isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      coachedTeams: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUserWithHash,
  updateUser,
  getAllUsersWithDetails,
  getCoaches
};