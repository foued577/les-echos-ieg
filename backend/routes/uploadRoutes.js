const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// Upload endpoint for gazette media
router.post('/cloudinary', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    console.log('🚀 DEBUG: Upload request received');
    console.log('📁 DEBUG: Request file:', req.file);
    console.log('📝 DEBUG: Request body:', req.body);
    console.log('🔐 DEBUG: User authenticated:', !!req.user);
    
    if (!req.file) {
      console.error('❌ ERROR: No file received');
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const { type = 'image' } = req.body;
    console.log(`🚀 Backend: Uploading ${type} to Cloudinary:`, req.file.originalname);

    // Check Cloudinary configuration
    console.log('☁️ DEBUG: Cloudinary config check:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
    });

    // Configure upload options based on type
    const uploadOptions = {
      folder: `gazette_${type}s`,
      resource_type: type === 'video' ? 'video' : 'auto',
      // Remove format parameter - it's causing the error
    };
    
    console.log('⚙️ DEBUG: Upload options:', uploadOptions);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload success:', result);
            resolve(result);
          }
        }
      ).end(req.file.buffer);
    });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      message: `${type} uploadé avec succès`
    });

  } catch (error) {
    console.error('❌ CLOUDINARY UPLOAD ERROR:', error);
    console.error('❌ ERROR STACK:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

module.exports = router;
