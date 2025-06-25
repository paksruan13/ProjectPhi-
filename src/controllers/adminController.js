const userService = require('../services/userService');
const teamService = require('../services/teamService');
const activityService = require('../services/activityService');

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsersWithDetails();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllTeams = async (req, res) => {
  try {
    const teams = await teamService.getTeamsWithDetails();
    res.json(teams);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};

const createTeam = async (req, res) => {
  try {
    const { name, coachId } = req.body;
    const team = await teamService.createTeamWithCode({ name, coachId: coachId || null });

    res.status(201).json({
      message: 'Team created successfully',
      team,
    });
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, coachId, isActive } = req.body;
    
    const team = await teamService.updateTeam(id, {
      name,
      coachId: coachId || null,
      isActive
    });

    res.json({
      message: 'Team updated successfully',
      team,
    });
  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ error: 'Failed to update team' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, teamId, isActive } = req.body;

    const user = await userService.updateUser(id, {
      role,
      teamId: teamId || null,
      isActive
    });

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const getCoaches = async (req, res) => {
  try {
    const coaches = await userService.getCoaches();
    res.json(coaches);
  } catch (err) {
    console.error('Error fetching coaches:', err);
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
};

const getActivityCategories = async (req, res) => {
  try {
    const categories = await activityService.getAllCategories();
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const createActivityCategory = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const category = await activityService.createCategory({
      name,
      description,
      color,
      icon
    });
    res.status(201).json(category);
  } catch (err) {
    console.error('Error creating category:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Category Name Already Exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const getAllActivities = async (req, res) => {
  try {
    const activities = await activityService.getAllActivities();
    res.json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

const createActivity = async (req, res) => {
  try {
    const { title, description, points, type, categoryId, requirements, isPublished } = req.body;
    const activity = await activityService.createActivity({
      title,
      description,
      points,
      type,
      categoryId,
      requirements: requirements || {},
      isPublished: isPublished || false
    }, req.user.id);

    res.status(201).json(activity);
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ error: 'Failed to create activity' });
  }
};

const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, points, type, categoryId, requirements, isPublished, isActive } = req.body;
    
    const activity = await activityService.updateActivity(id, {
      title,
      description,
      points,
      type,
      categoryId,
      requirements,
      isPublished,
      isActive
    });

    res.json(activity);
  } catch (err) {
    console.error('Error updating activity:', err);
    res.status(500).json({ error: 'Failed to update activity' });
  }
};

module.exports = {
  getAllUsers,
  getAllTeams,
  createTeam,
  updateTeam,
  updateUser,
  getCoaches,
  getActivityCategories,
  createActivityCategory,
  getAllActivities,
  createActivity,
  updateActivity
};