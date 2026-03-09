const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  content: {
    type: String,
    required: false // Rendu optionnel pour les fichiers
  },
  type: {
    type: String,
    enum: ['lien', 'fichier', 'article'],
    required: [true, 'Le type est requis']
  },
  file_url: {
    type: String,
    default: null
  },
  file_name: {
    type: String,
    default: null
  },
  mime_type: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'rejected'],
    default: 'draft'
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  rubrique_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rubrique',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  moderated_by: {
    type: String,
    required: false
  },
  moderation_date: {
    type: Date,
    required: false
  },
  moderation_comment: {
    type: String,
    required: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Content', contentSchema);
