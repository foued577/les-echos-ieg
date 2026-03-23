const express = require('express');
const { body } = require('express-validator');
const { getContents, getContentById, createContent, updateContent, deleteContent, getMyContents } = require('../controllers/contentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadCloudinary');

const router = express.Router();

// Validation pour la création/mise à jour (modifiée pour les fichiers)
const contentValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Le titre est requis')
    .isLength({ max: 100 })
    .withMessage('Le titre ne peut pas dépasser 100 caractères'),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Le contenu est requis'),
  body('type')
    .isIn(['lien', 'fichier', 'article'])
    .withMessage('Le type doit être lien, fichier ou article'),
  body('rubrique_id')
    .notEmpty()
    .withMessage('La rubrique est requise')
    .isMongoId()
    .withMessage('L\'ID de rubrique est invalide')
];

// Routes publiques (lecture)
router.get('/mine', authMiddleware, getMyContents); // Must come BEFORE /:id
router.get('/', authMiddleware, getContents); // ADD authMiddleware
router.get('/:id', authMiddleware, getContentById); // ADD authMiddleware

// Route de création avec upload de fichier
router.post('/', authMiddleware, upload.single('file'), contentValidation, createContent);
router.put('/:id', authMiddleware, updateContent);
router.delete('/:id', authMiddleware, deleteContent);

module.exports = router;
