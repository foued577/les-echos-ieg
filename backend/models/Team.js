const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de l\'équipe est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [200, 'La description ne peut pas dépasser 200 caractères']
  },
  color: {
    type: String,
    default: '#64748b'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
