const { prisma } = require('../config/database');

const calculateLeaderboard = async () => {
  const teams = await prisma.team.findMany({
    include: {
      donations: { select: { amount: true } },
      shirtSales: { select: { quantity: true } },
      photos: { select: { approved: true } },
      _count: {
        select: {
          donations: true,
          shirtSales: true,
          photos: true,
        }
      }
    }
  });

  const leaderboard = await Promise.all(teams.map(async team => {
    const totalDonations = team.donations.reduce((sum, donation) => sum + donation.amount, 0);
    const totalShirtPoints = team.shirtSales.reduce((sum, sale) => sum + (sale.quantity * 10), 0);
    const approvedPhotos = team.photos.filter(photo => photo.approved);
    const totalPhotoPoints = approvedPhotos.length * 50;
    const totalScore = totalDonations + totalShirtPoints + totalPhotoPoints;
    
    const memberCount = await prisma.user.count({
      where: { teamId: team.id },
    });

    return {
      id: team.id,
      name: team.name,
      totalScore,
      totalDonations,
      totalShirtPoints,
      donationCount: team._count.donations,
      shirtSaleCount: team._count.shirtSales,
      totalPhotoPoints,
      approvedPhotosCount: approvedPhotos.length,
      photoCount: team._count.photos,
      memberCount,
      createdAt: team.createdAt
    };
  }));

  leaderboard.sort((a, b) => b.totalScore - a.totalScore);
  
  return leaderboard.map((team, index) => ({
    ...team,
    rank: index + 1,
  }));
};

const emitLeaderboardUpdate = async (io) => {
  try {
    const leaderboard = await calculateLeaderboard();
    io.to('leaderboard').emit('leaderboard-update', leaderboard);
    console.log('Leaderboard update emitted to clients');
  } catch (err) {
    console.error('Error emitting leaderboard update:', err);
  }
};

module.exports = {
  calculateLeaderboard,
  emitLeaderboardUpdate
};