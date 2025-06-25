const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (userData) => {
  const existingUser = await prisma.user.findUnique({ 
    where: { email: userData.email } 
  });
  
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);

  const user = await prisma.user.create({
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

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
};

const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { team: true, coachedTeams: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error('Invalid password');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      coachedTeams: user.coachedTeams
    },
    token
  };
};

const registerWithTeam = async (userData) => {
  const team = await prisma.team.findUnique({
    where: { teamCode: userData.teamCode },
    select: { id: true, name: true, isActive: true },
  });

  if (!team) {
    throw new Error('Invalid team code');
  }

  if (!team.isActive) {
    throw new Error('Team registration is not active');
  }

  const existingUser = await prisma.user.findUnique({ 
    where: { email: userData.email } 
  });
  
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: 'STUDENT',
      teamId: team.id
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      team: { select: { id: true, name: true, teamCode: true } },
    }
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token, teamName: team.name };
};

module.exports = {
  registerUser,
  loginUser,
  registerWithTeam
};