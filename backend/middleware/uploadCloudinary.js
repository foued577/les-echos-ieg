const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require('path');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();

    return {
      folder: 'les-echos-ieg-files',
      resource_type: 'raw',
      public_id: `${Date.now()}-${path.basename(file.originalname, ext)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')}`,
      format: ext.replace('.', ''),
    };
  },
});

module.exports = multer({ storage });
