const mongoose = require('mongoose');

// Schéma Gazette
const GazetteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  blocks: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['title', 'text', 'image', 'video', 'link', 'section', 'quote', 'separator']
    },
    content: {
      type: String,
      default: ''
    },
    file: {
      type: mongoose.Schema.Types.Mixed
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }]
}, {
  timestamps: true
});

// Index pour la recherche
GazetteSchema.index({ title: 'text', description: 'text' });
GazetteSchema.index({ author_id: 1 });
GazetteSchema.index({ team_ids: 1 });
GazetteSchema.index({ status: 1 });
GazetteSchema.index({ createdAt: -1 });

const Gazette = mongoose.model('Gazette', GazetteSchema);

module.exports = Gazette;
