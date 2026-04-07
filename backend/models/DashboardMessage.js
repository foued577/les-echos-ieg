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

// Méthode pour activer un message et désactiver les autres
dashboardMessageSchema.methods.activate = async function() {
  // Désactiver tous les autres messages
  await this.constructor.updateMany(
    { _id: { $ne: this._id } },
    { isActive: false }
  );
  
  // Activer ce message
  this.isActive = true;
  return this.save();
};

module.exports = mongoose.model('DashboardMessage', dashboardMessageSchema);
