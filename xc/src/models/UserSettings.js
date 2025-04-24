const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    notifications: {
      type: Boolean,
      default: true
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'pt', 'ar'],
      default: 'en'
    },
    messagePreview: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    textMessageLengthLimit: {
      type: Number,
      default: 160,
      min: 0,
      max: 1000
    },
    enforceLengthLimit: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

module.exports = UserSettings; 