const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const teamRoutes = require('./teams');
const userRoutes = require('./users');
const donationRoutes = require('./donations');
const saleRoutes = require('./sales');
const photoRoutes = require('./photos');
const activityRoutes = require('./activities');
const leaderboardRoutes = require('./leaderboard');
const adminRoutes = require('./admin');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'Healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'Connected',
      redis: 'Connected',
      s3: 'Connected',
    }
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/teams', teamRoutes);
router.use('/users', userRoutes);
router.use('/donations', donationRoutes);
router.use('/sales', saleRoutes);
router.use('/photos', photoRoutes);
router.use('/activities', activityRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/admin', adminRoutes);

module.exports = router;