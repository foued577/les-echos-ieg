const mongoose = require('mongoose');

const dashboardMessageSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: '👋',
    maxlength: 10
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
dashboardMessageSchema.index({ isActive: 1 });
dashboardMessageSchema.index({ createdAt: -1 });

// Méthode pour activer un message (permet plusieurs messages actifs)
dashboardMessageSchema.methods.activate = async function() {
  // Activer ce message (sans désactiver les autres)
  this.isActive = true;
  return this.save();
};

// Méthode pour désactiver un message
dashboardMessageSchema.methods.deactivate = async function() {
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('DashboardMessage', dashboardMessageSchema);
