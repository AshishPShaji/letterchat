const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory at:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp + original name
    const uniqueFilename = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueFilename);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const filetypes = /jpeg|jpg|png|gif|mp4|mov|mp3|wav|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
  // Check extension and mime type
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, audio, and documents are allowed.'));
  }
};

// Determine file type
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
};

// File size limits (in bytes)
const fileSizeLimits = {
  image: 10 * 1024 * 1024, // 10MB for images
  video: 50 * 1024 * 1024, // 50MB for videos
  audio: 20 * 1024 * 1024, // 20MB for audio
  document: 25 * 1024 * 1024, // 25MB for documents
  default: 10 * 1024 * 1024 // 10MB default
};

// Set up upload with size limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Max 50MB file size overall
  }
});

// Export middleware and utility functions
module.exports = {
  upload,
  getFileType,
  uploadsDir,
  fileSizeLimits
};
