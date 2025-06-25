const { prisma } = require('../config/database');
const s3 = require('../config/s3');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuid } = require('uuid');

const uploadPhoto = async (file, teamId) => {
  const objectKey = `photos/${uuid()}-${file.originalname}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: 'test-bucket',
    Key: objectKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  const url = `http://${process.env.MINIO_ENDPOINT}/test-bucket/${objectKey}`;
  
  return await prisma.photo.create({
    data: {
      url,
      team: { connect: { id: teamId } },
    },
    include: { team: { select: { id: true, name: true } } },
  });
};

const getAllPhotos = async () => {
  return await prisma.photo.findMany({
    orderBy: { uploadedAt: 'desc' },
    include: { team: { select: { id: true, name: true } } },
  });
};

const getPendingPhotos = async () => {
  return await prisma.photo.findMany({
    where: { approved: false },
    orderBy: { uploadedAt: 'desc' },
    include: { team: { select: { id: true, name: true } } },
  });
};

const getApprovedPhotos = async () => {
  return await prisma.photo.findMany({
    where: { approved: true },
    orderBy: { uploadedAt: 'desc' },
    include: { team: { select: { id: true, name: true } } },
  });
};

const approvePhoto = async (photoId) => {
  return await prisma.photo.update({
    where: { id: photoId },
    data: { approved: true },
    include: { team: { select: { id: true, name: true } } },
  });
};

const rejectPhoto = async (photoId) => {
  return await prisma.photo.delete({
    where: { id: photoId }
  });
};

module.exports = {
  uploadPhoto,
  getAllPhotos,
  getPendingPhotos,
  getApprovedPhotos,
  approvePhoto,
  rejectPhoto
};