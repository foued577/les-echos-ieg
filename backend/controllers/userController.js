const User = require('../models/User');
const { validationResult } = require('express-validator');

// Obtenir tous les utilisateurs
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Erreur getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir un utilisateur par ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour un utilisateur
const updateUser = async (req, res) => {
  try {
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: updatedUser
    });
  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer un utilisateur
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Rechercher des utilisateurs (accessible à tous les utilisateurs authentifiés)
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    console.log('🔍 DEBUG: Searching users with query:', q, 'by user:', userId);

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La requête doit contenir au moins 2 caractères'
      });
    }

    // Rechercher des utilisateurs (sauf soi-même)
    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name email')
    .limit(10);

    console.log('✅ DEBUG: Found users:', users.length);

    res.status(200).json({
      success: true,
      message: 'Utilisateurs trouvés',
      data: users
    });

  } catch (error) {
    console.error('❌ ERROR: Failed to search users:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche d\'utilisateurs'
    });
  }
};

// Debug endpoint pour vérifier les utilisateurs dans la base
const debugUsers = async (req, res) => {
  try {
    console.log('🔍 DEBUG: Getting all users for debug');
    
    const allUsers = await User.find({}).select('name email role');
    
    console.log('✅ DEBUG: Total users in database:', allUsers.length);
    console.log('📋 DEBUG: Users list:', allUsers);

    res.status(200).json({
      success: true,
      message: 'Debug: Tous les utilisateurs',
      count: allUsers.length,
      data: allUsers
    });

  } catch (error) {
    console.error('❌ ERROR: Failed to get debug users:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du debug des utilisateurs'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
  debugUsers
};
