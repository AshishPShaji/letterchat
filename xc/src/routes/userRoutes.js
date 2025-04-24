const express = require('express');
const { 
  searchUsers, 
  updatePassword, 
  updateProfile, 
  updateProfilePicture, 
  getUserSettings,
  updateUserSettings
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');
const multer = require('multer');

const router = express.Router();

// Custom error handler for file size errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'Profile picture is too large. Maximum size is 10MB.' 
      });
    }
  }
  next(err);
};

router.route('/').get(protect, searchUsers);
router.route('/password').put(protect, updatePassword);
router.route('/profile').put(protect, updateProfile);
router.route('/profile-picture').put(protect, upload.single('profilePic'), handleUploadErrors, updateProfilePicture);
router.route('/settings').get(protect, getUserSettings).put(protect, updateUserSettings);

module.exports = router;
