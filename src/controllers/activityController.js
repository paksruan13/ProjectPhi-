const activityService = require('../services/activityService');

const getActivities = async (req, res) => {
  try {
    const activities = await activityService.getPublishedActivities(req.user.id);
    res.json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

module.exports = {
  getActivities
};