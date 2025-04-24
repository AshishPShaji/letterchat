const Chat = require('../models/Chat');
const User = require('../models/User');

// @desc    Create or access one-on-one chat
// @route   POST /api/chats
// @access  Private
exports.accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'UserId param not sent with request' });
  }

  try {
    // Find if a chat already exists between these two users
    let chat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('users', '-password')
      .populate('lastMessage');

    chat = await User.populate(chat, {
      path: 'lastMessage.sender',
      select: 'name email profilePic',
    });

    if (chat.length > 0) {
      res.json(chat[0]);
    } else {
      // Create a new chat
      const newChat = await Chat.create({
        chatName: 'sender',
        isGroupChat: false,
        users: [req.user._id, userId],
      });

      const fullChat = await Chat.findOne({ _id: newChat._id }).populate(
        'users',
        '-password'
      );

      res.status(201).json(fullChat);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all chats for a user
// @route   GET /api/chats
// @access  Private
exports.getChats = async (req, res) => {
  try {
    let chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: 'lastMessage.sender',
      select: 'name email profilePic',
    });

    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single chat by ID
// @route   GET /api/chats/:id
// @access  Private
exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is part of this chat
    if (!chat.users.some((u) => u._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }

    // Populate sender info for lastMessage
    const populatedChat = await User.populate(chat, {
      path: 'lastMessage.sender',
      select: 'name email profilePic',
    });

    res.json(populatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a group chat
// @route   POST /api/chats/group
// @access  Private
exports.createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  let users = req.body.users;

  // Add current user to the group
  if (users.length < 2) {
    return res
      .status(400)
      .json({ message: 'More than 2 users are required to form a group chat' });
  }

  users.push(req.user._id);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      isGroupChat: true,
      users: users,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(201).json(fullGroupChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rename a group chat
// @route   PUT /api/chats/group/:id
// @access  Private
exports.renameGroupChat = async (req, res) => {
  const { chatId, chatName } = req.body;

  if (!chatName) {
    return res.status(400).json({ message: 'Please provide a chat name' });
  }

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(updatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add user to a group
// @route   PUT /api/chats/group/add
// @access  Private
exports.addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if the requester is the admin
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admins can add users to the group' });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.json(updatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove user from a group
// @route   PUT /api/chats/group/remove
// @access  Private
exports.removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if the requester is the admin
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admins can remove users from the group' });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.json(updatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
