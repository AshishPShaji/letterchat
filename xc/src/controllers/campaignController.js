const User = require('../models/User');
const Message = require('../models/Message');
const Campaign = require('../models/Campaign');
const UserSettings = require('../models/UserSettings');

// @desc    Create and send a new SMS campaign
// @route   POST /api/campaigns
// @access  Private/Admin
exports.createCampaign = async (req, res) => {
  try {
    const { title, content, users } = req.body;

    // Validate input
    if (!title || !content || !users || !users.length) {
      return res.status(400).json({ 
        message: 'Please provide title, content, and at least one recipient' 
      });
    }

    // Get user settings for the sender
    const userSettings = await UserSettings.findOne({ user: req.user._id });
    
    // If user has custom length limit settings, use those, otherwise use default 160
    const lengthLimit = userSettings?.enforceLengthLimit ? 
      (userSettings.textMessageLengthLimit || 160) : 
      160;

    // Validate content length
    if (content.length > lengthLimit) {
      return res.status(400).json({ 
        message: `Message content cannot exceed ${lengthLimit} characters based on your settings` 
      });
    }

    // Create the campaign
    const campaign = await Campaign.create({
      title,
      content,
      sender: req.user._id,
      status: 'sent',
      recipientCount: users.length
    });

    // Find recipient users
    const recipients = await User.find({ _id: { $in: users } });
    
    if (recipients.length === 0) {
      return res.status(404).json({ message: 'No valid recipients found' });
    }

    // Log campaign creation
    console.log(`Campaign created: ${campaign.title} with ${recipients.length} recipients`);

    // Deliver messages to each recipient
    const messagePromises = recipients.map(async (recipient) => {
      // Create a message for each recipient
      const message = await Message.create({
        sender: req.user._id,
        receiver: recipient._id,
        content,
        isCampaign: true,
        campaignId: campaign._id,
        readBy: [], // Empty initially
        deliveredTo: [] // Empty initially
      });

      // If socket connection is available, notify users
      if (global.io) {
        // Check if user is online
        const userSocketId = global.connectedUsers.get(recipient._id.toString());
        
        if (userSocketId) {
          // Send notification to user
          global.io.to(userSocketId).emit('notification', {
            type: 'campaign',
            message: {
              _id: message._id,
              sender: {
                _id: req.user._id,
                name: req.user.name,
                profilePic: req.user.profilePic
              },
              content: message.content,
              campaignId: campaign._id,
              campaignTitle: campaign.title
            }
          });
          
          // Mark as delivered immediately for online users
          message.deliveredTo.push(recipient._id);
          await message.save();
          
          // Update campaign delivery metrics
          campaign.deliveredCount += 1;
          await campaign.save();
        }
      }

      return message;
    });

    // Wait for all messages to be created and sent
    const sentMessages = await Promise.all(messagePromises);

    // Update campaign with message IDs
    campaign.messages = sentMessages.map(msg => msg._id);
    await campaign.save();

    res.status(201).json({
      campaign,
      messagesSent: sentMessages.length
    });
  } catch (error) {
    console.error('Campaign creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private/Admin
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({})
      .sort({ createdAt: -1 })
      .populate('sender', 'name email');

    res.json(campaigns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get campaign details
// @route   GET /api/campaigns/:id
// @access  Private/Admin
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('sender', 'name email')
      .populate({
        path: 'messages',
        populate: {
          path: 'receiver',
          select: 'name email profilePic'
        }
      });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}; 