const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 160
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'failed'],
      default: 'draft'
    },
    recipientCount: {
      type: Number,
      default: 0
    },
    messages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }],
    // Additional metrics
    deliveredCount: {
      type: Number,
      default: 0
    },
    readCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign; 