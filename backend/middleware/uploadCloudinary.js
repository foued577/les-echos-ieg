const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');
const path = require('path');

function sanitizeFilename(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdf = ext === '.pdf';

    return {
      folder: 'les-echos-ieg-files',
      resource_type: isPdf ? 'image' : 'raw', // 🔥 IMPORTANT
      public_id: `${Date.now()}-${sanitizeFilename(
        path.basename(file.originalname, ext)
      )}`,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
