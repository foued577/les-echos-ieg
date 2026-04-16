const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require('path');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    console.log('🔍 FILE TYPE DETECTION:', {
      originalname: file.originalname,
      extension: ext,
      mimetype: file.mimetype
    });

    const uploadParams = {
      folder: 'les-echos-ieg-files',
      resource_type: 'auto', // ✅ FORCÉ : auto pour TOUS les fichiers
      type: 'upload', // ✅ FORCÉ : rend les fichiers publics
      access_mode: 'public', // ✅ FORCÉ : accès public explicite
      public_id: `${Date.now()}-${path.basename(file.originalname, ext)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')}`,
      format: ext.replace('.', ''),
    };

    console.log('🚀 FORCED UPLOAD PARAMS:', uploadParams);
    return uploadParams;
  },
});

module.exports = multer({ storage });
