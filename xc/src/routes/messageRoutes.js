const express = require('express');
const { 
  sendMessage, 
  getMessages,
  deleteMessageForMe,
  deleteMessageForEveryone,
  markMessagesAsRead,
  markMessagesAsDelivered
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');
const multer = require('multer');

const router = express.Router();

// Custom error handler for file size errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'File is too large. Maximum file size is 50MB for videos, 10MB for images, 20MB for audio, and 25MB for documents.' 
      });
    }
  }
  next(err);
};

// Send message route with file upload middleware
router.post('/', protect, upload.single('file'), handleUploadErrors, sendMessage);

// Get messages route
router.get('/:chatId', protect, getMessages);

// Delete message routes
router.delete('/:id/forMe', protect, deleteMessageForMe);
router.delete('/:id/forEveryone', protect, deleteMessageForEveryone);

// Message status routes
router.put('/read', protect, markMessagesAsRead);
router.put('/deliver', protect, markMessagesAsDelivered);

module.exports = router;
