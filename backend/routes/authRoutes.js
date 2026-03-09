const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Debug: Log toutes les requêtes
router.use((req, res, next) => {
  console.log(`🔍 Auth Route: ${req.method} ${req.path}`);
  console.log('🔍 Headers:', req.headers);
  console.log('🔍 Body:', req.body);
  next();
});

// Validation pour l'inscription
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ max: 50 })
    .withMessage('Le nom ne peut pas dépasser 50 caractères'),
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'EDITOR', 'MEMBER'])
    .withMessage('Le rôle doit être ADMIN, EDITOR ou MEMBER')
];

// Validation pour la connexion
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

// Routes publiques
router.post('/register', registerValidation, (req, res, next) => {
  console.log('📝 Register route called');
  next();
}, register);

router.post('/login', loginValidation, (req, res, next) => {
  console.log('🔐 Login route called');
  next();
}, login);

// Routes protégées
router.get('/me', authMiddleware, getMe);

module.exports = router;
