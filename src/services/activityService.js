const { prisma } = require('../config/database');

const getAllCategories = async () => {
  return await prisma.activityCategory.findMany({
    include: {
      activities: {
        select: { id: true, title: true, isPublished: true }
      }
    },
    orderBy: { name: 'asc' }
  });
};

const createCategory = async (categoryData) => {
  return await prisma.activityCategory.create({
    data: categoryData
  });
};

const getAllActivities = async () => {
  const activities = await prisma.activity.findMany({
    include: {
      category: true,
      createdBy: {
        select: { id: true, name: true }
      },
      submission: {
        select: { id: true, status: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return activities.map(activity => ({
    ...activity,
    submissionCount: activity.submission.length,
    pendingCount: activity.submission.filter(s => s.status === 'PENDING').length,
    approvedCount: activity.submission.filter(s => s.status === 'APPROVED').length
  }));
};

const createActivity = async (activityData, createdById) => {
  return await prisma.activity.create({
    data: {
      ...activityData,
      createdById
    },
    include: {
      category: true,
      createdBy: {
        select: { id: true, name: true }
      }
    }
  });
};

const updateActivity = async (activityId, updateData) => {
  return await prisma.activity.update({
    where: { id: activityId },
    data: updateData,
    include: {
      category: true,
      createdBy: {
        select: { id: true, name: true }
      }
    }
  });
};

const getPublishedActivities = async (userId) => {
  return await prisma.activity.findMany({
    where: {
      isPublished: true,
      isActive: true
    },
    include: {
      category: true,
      submission: {
        where: { userId },
        select: { id: true, status: true, pointsAwarded: true, createdAt: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

module.exports = {
  getAllCategories,
  createCategory,
  getAllActivities,
  createActivity,
  updateActivity,
  getPublishedActivities
};