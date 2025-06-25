const saleService = require('../services/saleService');

const createSale = async (req, res) => {
  const { quantity, teamId } = req.body;
  if (quantity == null || !teamId) {
    return res.status(400).json({
      error: 'quantity (number) and teamId (UUID) are required'
    });
  }

  try {
    const saleData = {
      quantity,
      team: { connect: { id: teamId } },
    };

    const sale = await saleService.createSale(saleData);
    res.status(201).json(sale);
  } catch (err) {
    console.error('Error creating shirt sale:', err);
    res.status(500).json({ error: err.message });
  }
};

const getAllSales = async (req, res) => {
  try {
    const sales = await saleService.getAllSales();
    res.json(sales);
  } catch (err) {
    console.error('Error fetching shirt sales:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createSale,
  getAllSales
};