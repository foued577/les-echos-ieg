const User = require('../models/User');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

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

    // DEBUG: Temporarily disable user exclusion for testing
    console.log('🔍 DEBUG: User exclusion DISABLED for testing');

    // Rechercher des utilisateurs sur TOUS les champs possibles
    const users = await User.find({
      // _id: { $ne: userId }, // TEMPORARILY COMMENTED FOR DEBUG
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name email firstName lastName fullName username')
    .limit(20); // Increased limit for debugging

    console.log('✅ DEBUG: Found users:', users.length);
    console.log('📋 DEBUG: User details:', users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: u.fullName,
      username: u.username
    })));

    res.status(200).json({
      success: true,
      message: 'Utilisateurs trouvés',
      data: users,
      debug: {
        query: q,
        userId: userId,
        userExclusion: false, // DEBUG
        foundCount: users.length
      }
    });

  } catch (error) {
    console.error('❌ ERROR: Failed to search users:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche d\'utilisateurs',
      error: error.message
    });
  }
};

// Mettre à jour la photo de profil
const uploadProfileImage = async (req, res) => {
  try {
    console.log('📸=== UPLOAD PROFILE IMAGE START ===');
    console.log('📸 User ID:', req.user.id);
    console.log('📸 File received:', req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    // Validation du type de fichier
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Format de fichier non autorisé. Utilisez JPG, JPEG, PNG ou WebP.'
      });
    }

    // Validation de la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux. Maximum 5MB autorisé.'
      });
    }

    // Récupérer l'utilisateur actuel
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Supprimer l'ancienne image de profil si elle existe sur Cloudinary
    if (user.avatar && user.avatar.includes('cloudinary')) {
      try {
        // Extraire le public_id de l'URL Cloudinary
        const urlParts = user.avatar.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split('.')[0];
        
        if (publicId && publicId !== 'photo-1740698338265-0') {
          await cloudinary.uploader.destroy(`profile_images/${publicId}`);
          console.log('🗑️ Old profile image deleted from Cloudinary:', publicId);
        }
      } catch (deleteError) {
        console.log('⚠️ Could not delete old profile image:', deleteError.message);
      }
    }

    // Mettre à jour l'utilisateur avec la nouvelle URL de l'image
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: req.file.path },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('✅=== PROFILE IMAGE UPDATED ===');
    console.log('✅ New avatar URL:', updatedUser.avatar);
    console.log('✅ User updated:', updatedUser.name);

    res.status(200).json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      data: {
        user: updatedUser,
        avatar_url: updatedUser.avatar
      }
    });

  } catch (error) {
    console.error('❌ ERROR: uploadProfileImage failed:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la photo de profil',
      error: error.message
    });
  }
};

// Obtenir le profil utilisateur actuel (avec avatar)
const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
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
    console.error('❌ ERROR: getCurrentUserProfile failed:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// Debug endpoint pour vérifier les utilisateurs dans la base
const debugUsers = async (req, res) => {
  try {
    console.log('🔍 DEBUG: Getting all users for debug');
    
    const allUsers = await User.find({}).select('name email firstName lastName fullName username role');
    
    console.log('✅ DEBUG: Total users in database:', allUsers.length);
    console.log('📋 DEBUG: Users list with ALL fields:', allUsers);

    res.status(200).json({
      success: true,
      message: 'Debug: Tous les utilisateurs',
      count: allUsers.length,
      data: allUsers,
      debug: {
        fields: ['name', 'email', 'firstName', 'lastName', 'fullName', 'username', 'role'],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ ERROR: Failed to get debug users:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du debug des utilisateurs',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
  debugUsers,
  uploadProfileImage,
  getCurrentUserProfile
};
