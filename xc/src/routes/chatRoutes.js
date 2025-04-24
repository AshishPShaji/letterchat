const express = require('express');
const { 
  accessChat,
  getChats,
  createGroupChat,
  renameGroupChat,
  addToGroup,
  removeFromGroup,
  getChatById
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/').post(protect, accessChat).get(protect, getChats);
router.route('/:id').get(protect, getChatById);
router.route('/group').post(protect, createGroupChat);
router.route('/group/rename').put(protect, renameGroupChat);
router.route('/group/add').put(protect, addToGroup);
router.route('/group/remove').put(protect, removeFromGroup);

module.exports = router;
