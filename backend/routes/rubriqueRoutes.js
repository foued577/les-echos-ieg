const express = require('express');
const { body } = require('express-validator');
const { getRubriques, getRubriqueById, createRubrique, updateRubrique, deleteRubrique } = require('../controllers/rubriqueController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Validation pour la création/mise à jour
const rubriqueValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom de la rubrique est requis')
    .isLength({ max: 50 })
    .withMessage('Le nom ne peut pas dépasser 50 caractères'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('La description est requise')
    .isLength({ max: 200 })
    .withMessage('La description ne peut pas dépasser 200 caractères'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('La couleur doit être un code hexadécimal valide')
];

// Routes publiques (lecture)
router.get('/', getRubriques);
router.get('/:id', getRubriqueById);

// Routes protégées (écriture) - Admin et Editor
router.post('/', authMiddleware, roleMiddleware('ADMIN', 'EDITOR'), rubriqueValidation, createRubrique);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN', 'EDITOR'), rubriqueValidation, updateRubrique);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteRubrique);

module.exports = router;
