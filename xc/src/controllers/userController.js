const User = require('../models/User');
const UserSettings = require('../models/UserSettings');

// @desc    Search users
// @route   GET /api/users
// @access  Private
exports.searchUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  try {
    // Find all users except the current user
    const users = await User.find({
      ...keyword,
      _id: { $ne: req.user._id },
    }).select('-password');

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate request body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both current and new password' });
    }

    // Check minimum password length
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    
    // Create update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    
    // Handle email update separately - need to check if it's already in use
    if (email) {
      // Check if email already exists for a different user
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
      updateData.email = email;
    }
    
    // If no fields to update, return early
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No update data provided' });
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile picture
// @route   PUT /api/users/profile-picture
// @access  Private
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    // Get the file path
    const profilePicUrl = req.file.path;

    // Update the user profile picture
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, 
      { profilePic: profilePicUrl }, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user settings
// @route   GET /api/users/settings
// @access  Private
exports.getUserSettings = async (req, res) => {
  try {
    // Try to find existing settings
    let settings = await UserSettings.findOne({ user: req.user._id });
    
    // If no settings found, create default settings
    if (!settings) {
      settings = await UserSettings.create({
        user: req.user._id,
        // Default values are set in the schema
      });
    }
    
    res.status(200).json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
exports.updateUserSettings = async (req, res) => {
  try {
    const { 
      notifications, 
      darkMode, 
      language, 
      messagePreview, 
      soundEnabled,
      textMessageLengthLimit,
      enforceLengthLimit 
    } = req.body;
    
    // Create update object with only valid fields
    const updateData = {};
    if (notifications !== undefined) updateData.notifications = notifications;
    if (darkMode !== undefined) updateData.darkMode = darkMode;
    if (language !== undefined) updateData.language = language;
    if (messagePreview !== undefined) updateData.messagePreview = messagePreview;
    if (soundEnabled !== undefined) updateData.soundEnabled = soundEnabled;
    
    // Handle text message length settings
    if (textMessageLengthLimit !== undefined) {
      // Validate number within acceptable range
      const limit = parseInt(textMessageLengthLimit);
      if (isNaN(limit) || limit < 0 || limit > 1000) {
        return res.status(400).json({ message: 'Text message length limit must be between 0 and 1000' });
      }
      updateData.textMessageLengthLimit = limit;
    }
    
    if (enforceLengthLimit !== undefined) {
      updateData.enforceLengthLimit = enforceLengthLimit;
    }
    
    // Find and update settings, creating if it doesn't exist
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    
    res.status(200).json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}; 