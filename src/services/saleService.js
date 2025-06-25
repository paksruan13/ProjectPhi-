const { prisma } = require('../config/database');

const createSale = async (saleData) => {
  return await prisma.shirtSale.create({
    data: saleData,
    include: {
      team: { select: { id: true, name: true } },
    },
  });
};

const getAllSales = async () => {
  return await prisma.shirtSale.findMany({
    orderBy: { soldAt: 'desc' },
    include: {
      team: { select: { id: true, name: true } },
    },
  });
};

module.exports = {
  createSale,
  getAllSales
};