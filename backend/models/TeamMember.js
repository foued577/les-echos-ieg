const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member', 'editor'],
    default: 'member'
  },
  joined_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index composé pour éviter les doublons
teamMemberSchema.index({ team_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
