const express = require('express');
const router = express.Router();
const DashboardMessage = require('../models/DashboardMessage');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// GET /api/dashboard-messages - Récupérer tous les messages (admin uniquement)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('📋 DEBUG: Getting all dashboard messages');
    
    const messages = await DashboardMessage.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`📋 DEBUG: Found ${messages.length} dashboard messages`);
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('📋 ERROR: Failed to get dashboard messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages'
    });
  }
});

// GET /api/dashboard-messages/active - Récupérer le message actif (public)
router.get('/active', async (req, res) => {
  try {
    console.log('📋 DEBUG: Getting active dashboard message');
    
    const activeMessage = await DashboardMessage.findOne({ isActive: true })
      .populate('createdBy', 'name email');
    
    console.log(`📋 DEBUG: Active message found:`, activeMessage ? activeMessage.content : 'None');
    
    res.json({
      success: true,
      data: activeMessage
    });
  } catch (error) {
    console.error('📋 ERROR: Failed to get active message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du message actif'
    });
  }
});

// POST /api/dashboard-messages - Ajouter un message (admin uniquement)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('📋 DEBUG: Creating new dashboard message:', req.body);
    
    const { label, content, icon } = req.body;
    
    // Validation
    if (!label || !content) {
      return res.status(400).json({
        success: false,
        message: 'Le label et le contenu sont requis'
      });
    }
    
    const newMessage = new DashboardMessage({
      label: label.trim(),
      content: content.trim(),
      icon: icon?.trim() || '👋',
      createdBy: req.user._id
    });
    
    await newMessage.save();
    await newMessage.populate('createdBy', 'name email');
    
    console.log('📋 DEBUG: Dashboard message created successfully:', newMessage._id);
    
    res.status(201).json({
      success: true,
      message: 'Message créé avec succès',
      data: newMessage
    });
  } catch (error) {
    console.error('📋 ERROR: Failed to create dashboard message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du message'
    });
  }
});

// PUT /api/dashboard-messages/:id/activate - Activer un message (admin uniquement)
router.put('/:id/activate', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('📋 DEBUG: Activating dashboard message:', req.params.id);
    
    const message = await DashboardMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }
    
    await message.activate();
    await message.populate('createdBy', 'name email');
    
    console.log('📋 DEBUG: Dashboard message activated successfully:', message._id);
    
    res.json({
      success: true,
      message: 'Message activé avec succès',
      data: message
    });
  } catch (error) {
    console.error('📋 ERROR: Failed to activate dashboard message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation du message'
    });
  }
});

// DELETE /api/dashboard-messages/:id - Supprimer un message (admin uniquement)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('📋 DEBUG: Deleting dashboard message:', req.params.id);
    
    const message = await DashboardMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }
    
    // Empêcher la suppression du message actif
    if (message.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer le message actif. Veuillez d\'abord en activer un autre.'
      });
    }
    
    await DashboardMessage.findByIdAndDelete(req.params.id);
    
    console.log('📋 DEBUG: Dashboard message deleted successfully:', req.params.id);
    
    res.json({
      success: true,
      message: 'Message supprimé avec succès'
    });
  } catch (error) {
    console.error('📋 ERROR: Failed to delete dashboard message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du message'
    });
  }
});

module.exports = router;
