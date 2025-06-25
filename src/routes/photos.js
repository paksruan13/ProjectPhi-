const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const upload = require('../middleware/upload');

router.post('/', upload.single('file'), photoController.uploadPhoto);
router.get('/', photoController.getAllPhotos);
router.get('/pending', photoController.getPendingPhotos);
router.get('/approved', photoController.getApprovedPhotos);
router.put('/:id/approve', photoController.approvePhoto);
router.put('/:id/reject', photoController.rejectPhoto);

module.exports = router;