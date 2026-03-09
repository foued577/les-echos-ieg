const express = require('express');
const { body } = require('express-validator');
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Validation pour la mise à jour
const updateValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ max: 50 })
    .withMessage('Le nom ne peut pas dépasser 50 caractères'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['ADMIN', 'EDITOR', 'MEMBER'])
    .withMessage('Le rôle doit être ADMIN, EDITOR ou MEMBER')
];

// Routes protégées - Admin uniquement
router.get('/', authMiddleware, roleMiddleware('ADMIN'), getUsers);
router.get('/:id', authMiddleware, roleMiddleware('ADMIN'), getUserById);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), updateValidation, updateUser);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteUser);

module.exports = router;
