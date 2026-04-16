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
      resource_type: type === 'video' ? 'video' : 'auto', // ✅ CORRIGÉ : auto au lieu de raw
      type: 'upload', // ✅ AJOUTÉ : rend les fichiers publics
      access_mode: 'public', // ✅ AJOUTÉ : accès public explicite
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
            console.log('✅ Cloudinary upload success:');
            console.log('CLOUDINARY UPLOAD RESULT:', {
              public_id: result.public_id,
              resource_type: result.resource_type,
              type: result.type,
              access_mode: result.access_mode,
              url: result.url,
              secure_url: result.secure_url,
              format: result.format,
              original_filename: result.original_filename
            });
            resolve(result);
          }
        }
      ).end(req.file.buffer);
    });

    console.log('TEST THIS URL DIRECTLY:', result.secure_url);
    
    // ✅ VÉRIFICATION CRITIQUE : URL doit contenir image/upload
    if (result.secure_url.includes('/raw/upload/')) {
      console.error('🚨 CRITICAL ERROR: URL still contains /raw/upload/ - Backend fix not working!');
      console.error('🚨 EXPECTED: /image/upload/');
      console.error('🚨 ACTUAL:', result.secure_url);
    } else if (result.secure_url.includes('/image/upload/')) {
      console.log('✅ SUCCESS: URL contains /image/upload/ - Fix working!');
    } else {
      console.log('⚠️ WARNING: Unexpected URL format:', result.secure_url);
    }

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
