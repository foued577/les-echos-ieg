const mongoose = require('mongoose');

const rubriqueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la rubrique est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [200, 'La description ne peut pas dépasser 200 caractères']
  },
  team_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  color: {
    type: String,
    required: [true, 'La couleur est requise'],
    default: '#0f766e'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Rubrique', rubriqueSchema);
