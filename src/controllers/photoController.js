const photoService = require('../services/photoService');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');

const uploadPhoto = async (req, res) => {
  const { teamId } = req.body;
  if (!teamId || !req.file) {
    return res.status(400).json({ error: 'file (binary) and teamId are required' });
  }

  try {
    const photo = await photoService.uploadPhoto(req.file, teamId);
    res.status(201).json(photo);
  } catch (err) {
    console.error('Error uploading photo:', err);
    res.status(500).json({ error: err.message });
  }
};

const getAllPhotos = async (req, res) => {
  try {
    const photos = await photoService.getAllPhotos();
    res.json(photos);
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: err.message });
  }
};

const getPendingPhotos = async (req, res) => {
  try {
    const pendingPhotos = await photoService.getPendingPhotos();
    res.json(pendingPhotos);
  } catch (err) {
    console.error('Error fetching pending photos:', err);
    res.status(500).json({ error: err.message });
  }
};

const getApprovedPhotos = async (req, res) => {
  try {
    const approvedPhotos = await photoService.getApprovedPhotos();
    res.json(approvedPhotos);
  } catch (err) {
    console.error('Error fetching approved photos:', err);
    res.status(500).json({ error: err.message });
  }
};

const approvePhoto = async (req, res) => {
  const { id } = req.params;
  try {
    const photo = await photoService.approvePhoto(id);
    console.log('Photo Approved!', photo.id, 'for team:', photo.team.name);
    
    const io = req.app.get('io');
    await emitLeaderboardUpdate(io);
    io.to('leaderboard').emit('photo-approved', {
      photoId: photo.id,
      teamId: photo.team.id,
      teamName: photo.team.name,
      timeStamp: new Date(),
    });
    
    res.json(photo);
  } catch (err) {
    console.error('Error approving photo:', err);
    res.status(500).json({ error: err.message });
  }
};

const rejectPhoto = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const photo = await photoService.rejectPhoto(id);
    console.log('Photo Rejected!', photo.id);

    const io = req.app.get('io');
    io.to('leaderboard').emit('photo-rejected', {
      photoId: photo.id,
      reason,
      timeStamp: new Date(),
    });

    res.json({ message: 'Photo Rejected and Removed' });
  } catch (err) {
    console.error('Error rejecting photo:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  uploadPhoto,
  getAllPhotos,
  getPendingPhotos,
  getApprovedPhotos,
  approvePhoto,
  rejectPhoto
};