const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const { getContents, getContentById, createContent, updateContent, deleteContent, getMyContents } = require('../controllers/contentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// S'assurer que le dossier uploads existe
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Dossier uploads créé:', uploadsDir);
}

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter tous les types de fichiers pour l'instant
    cb(null, true);
  }
});

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
