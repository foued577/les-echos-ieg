const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification
const authMiddleware = async (req, res, next) => {
  let token;

  console.log('🔐=== AUTH MIDDLEWARE START ===');
  console.log('🔐 Headers:', req.headers);

  // Vérifier si le token est dans les headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('🔐 Token extracted:', token ? 'YES' : 'NO');
  }

  // Si pas de token
  if (!token) {
    console.log('❌ No token found');
    return res.status(401).json({ 
      success: false, 
      message: 'Accès non autorisé - Token manquant' 
    });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Token decoded:', decoded);
    
    // Ajouter l'utilisateur à la requête
    req.user = await User.findById(decoded.id).select('-password');
    console.log('🔐 User found:', !!req.user);
    
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Accès non autorisé - Token invalide' 
    });
  }
};

module.exports = authMiddleware;
