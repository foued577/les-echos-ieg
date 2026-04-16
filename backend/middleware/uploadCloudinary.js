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
      resource_type: 'auto', // ✅ Simple : auto pour tous les fichiers
      // ❌ Supprimé : type et access_mode (ignorés par le preset)
      public_id: `${Date.now()}-${path.basename(file.originalname, ext)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')}`,
      format: ext.replace('.', ''),
    };

    console.log('🚀 SIMPLIFIED UPLOAD PARAMS:', uploadParams);
    return uploadParams;
  },
});

module.exports = multer({ storage });
