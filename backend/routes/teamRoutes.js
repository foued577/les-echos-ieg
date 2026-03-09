const express = require('express');
const { body } = require('express-validator');
const { 
  getTeams, 
  getTeamById, 
  createTeam, 
  updateTeam, 
  deleteTeam,
  getTeamContents 
} = require('../controllers/teamController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Validation pour la création/mise à jour
const teamValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom de l\'équipe est requis')
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
    .withMessage('La couleur doit être un code hexadécimal valide (ex: #FF5733)')
];

// Routes publiques (lecture)
router.get('/', getTeams);
router.get('/:id', getTeamById);

// Routes protégées (écriture) - Admin et Editor
router.post('/', authMiddleware, roleMiddleware('ADMIN', 'EDITOR'), teamValidation, createTeam);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN', 'EDITOR'), teamValidation, updateTeam);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteTeam);

// Get team contents
router.get('/:teamId/contents', authMiddleware, getTeamContents);

module.exports = router;
