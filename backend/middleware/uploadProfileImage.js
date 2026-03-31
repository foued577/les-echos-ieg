const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configuration spécifique pour les photos de profil
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_images', // Dossier séparé pour les photos de profil
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => {
      // Nom de fichier unique avec timestamp et ID utilisateur
      const timestamp = Date.now();
      const userId = req.user?.id || 'unknown';
      return `profile_${userId}_${timestamp}`;
    },
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' }, // Redimensionnement et recadrage
      { quality: 'auto:good' }, // Qualité optimisée
      { fetch_format: 'auto' } // Format optimal
    ]
  }
});

const uploadProfileImage = multer({
  storage: profileImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Validation des types MIME
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non autorisé. Utilisez JPG, JPEG, PNG ou WebP.'), false);
    }
  }
});

module.exports = uploadProfileImage.single('profileImage');
