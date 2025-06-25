const donationService = require('../services/donationService');

const createDonation = async (req, res) => {
  const { amount, currency = 'usd', userId, teamId } = req.body;
  if (amount == null || !teamId) {
    return res.status(400).json({
      error: 'amount (number) and teamId (UUID) are required'
    });
  }

  try {
    const donationData = {
      amount,
      currency,
      user: userId ? { connect: { id: userId } } : undefined,
      team: { connect: { id: teamId } },
    };

    const donation = await donationService.createDonation(donationData);
    res.status(201).json(donation);
  } catch (err) {
    console.error('Error creating donation:', err);
    res.status(500).json({ error: err.message });
  }
};

const getAllDonations = async (req, res) => {
  try {
    const donations = await donationService.getAllDonations();
    res.json(donations);
  } catch (err) {
    console.error('Error fetching donations:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createDonation,
  getAllDonations
};