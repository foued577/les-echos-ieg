const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Inscription
const register = async (req, res) => {
  try {
    console.log('🔐=== SIGNUP START ===');
    console.log('🔐 Request body:', req.body);
    
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;
    console.log('📝 Extracted data:', { name, email, role, passwordLength: password?.length });

    // DEBUG: Afficher tous les utilisateurs AVANT la recherche
    const allUsersBefore = await User.find({});
    console.log('👥 All users BEFORE search:', allUsersBefore.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));

    // Vérifier si l'utilisateur existe déjà
    console.log('🔍 Searching for user with email:', email);
    const existingUser = await User.findOne({ email });
    console.log('🔍 Existing user check:', !!existingUser);
    if (existingUser) {
      console.log('❌ User already exists:', { id: existingUser._id, name: existingUser.name, email: existingUser.email, role: existingUser.role });
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Créer l'utilisateur
    console.log('📝 Creating new user...');
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'MEMBER'
    });
    console.log('✅ User created:', { id: user._id, name: user.name, email: user.email, role: user.role });

    // DEBUG: Afficher tous les utilisateurs APRÈS la création
    const allUsersAfter = await User.find({});
    console.log('👥 All users AFTER creation:', allUsersAfter.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));

    // Générer le token
    const token = generateToken(user._id, user.role);
    console.log('🎟 Token generated for user:', user._id, 'with role:', user.role);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token
      }
    });
  } catch (error) {
    console.error('💥 Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Connexion
const login = async (req, res) => {
  try {
    console.log('🔐=== LOGIN START ===');
    console.log('🔐 Request body:', req.body);
    
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('📝 Login attempt:', { email, passwordLength: password?.length });

    // DEBUG: Afficher tous les utilisateurs dans la base
    const allUsers = await User.find({});
    console.log('👥 All users in database:', allUsers.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select('+password');
    console.log('🔍 User found:', !!user);
    if (user) {
      console.log('👤 User data:', { id: user._id, name: user.name, email: user.email, role: user.role });
    }
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    console.log('🔐 Comparing passwords...');
    const isMatch = await user.matchPassword(password);
    console.log('🔐 Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password comparison failed');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token
    const token = generateToken(user._id, user.role);
    console.log('🎟 Token generated for user:', user._id, 'with role:', user.role);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token
      }
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir l'utilisateur actuel
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Générer un token JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

module.exports = {
  register,
  login,
  getMe
};
