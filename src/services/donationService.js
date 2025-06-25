const { prisma } = require('../config/database');

const createDonation = async (donationData) => {
  return await prisma.donation.create({
    data: donationData,
    include: {
      user: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
    }
  });
};

const getAllDonations = async () => {
  return await prisma.donation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
    }
  });
};

module.exports = {
  createDonation,
  getAllDonations
};