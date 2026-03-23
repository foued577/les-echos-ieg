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
    // Déterminer le resource_type en fonction du type de fichier
    const isPdf = file.mimetype === 'application/pdf';
    const isDocument = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                       'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                       'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(file.mimetype);
    
    return {
      folder: 'les-echos-ieg-files',
      resource_type: isPdf || isDocument ? 'raw' : 'auto', // PDFs et documents en 'raw'
      type: 'upload', // ✅ Rend les fichiers publics (évite 401 Unauthorized)
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
    };
  }
});

module.exports = {
  cloudinary,
  storage
};
