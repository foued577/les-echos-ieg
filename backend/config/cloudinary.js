const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration du stockage pour multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const path = require('path');
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Déterminer le resource_type en fonction du type de fichier
    const isPdf = ext === '.pdf';
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    const isDocument = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip'].includes(ext);
    
    // Fonction pour nettoyer le nom de fichier
    const sanitizeFilename = (name) => {
      return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Enlève les accents
        .replace(/[^a-zA-Z0-9-_]/g, '-') // Caractères autorisés
        .replace(/-+/g, '-') // Évite les doubles tirets
        .replace(/^-|-$/g, ''); // Enlève les tirets de début/fin
    };
    
    const baseName = sanitizeFilename(path.basename(file.originalname, ext));
    
    return {
      folder: 'les-echos-ieg-files',
      resource_type: isPdf || isImage ? 'image' : 'raw', // PDFs et images en 'image', autres documents en 'raw'
      type: 'upload', // ✅ Rend les fichiers publics (évite 401 Unauthorized)
      public_id: `${Date.now()}-${baseName}${ext}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip']
    };
  }
});

module.exports = {
  cloudinary,
  storage
};
