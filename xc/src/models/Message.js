const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: function() {
        return !this.fileUrl; // Content is required only if no file is attached
      },
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', null],
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      // Not required for campaign messages
      required: function() {
        return !this.isCampaign;
      },
    },
    // Optional recipient field for direct messages or campaigns
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Campaign related fields
    isCampaign: {
      type: Boolean,
      default: false,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    deliveredTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
