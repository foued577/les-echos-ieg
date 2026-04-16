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
    console.log('=== CLOUDINARY UPLOAD DIAGNOSTIC START ===');
    console.log('Upload request received');
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);
    console.log('User authenticated:', !!req.user);
    
    if (!req.file) {
      console.error('ERROR: No file received');
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const { type = 'image' } = req.body;
    console.log(`Backend: Uploading ${type} to Cloudinary:`, req.file.originalname);

    // Check Cloudinary configuration
    console.log('Cloudinary config check:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
    });

    // Test direct d'upload minimal (sans middleware)
    console.log('=== MINIMAL DIRECT UPLOAD TEST ===');
    const directResult = await new Promise((resolve, reject) => {
      const tempBuffer = req.file.buffer;
      
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          type: 'upload',
          access_mode: 'public',
          folder: 'test-direct-upload'
        },
        (error, result) => {
          if (error) {
            console.error('Direct upload error:', error);
            reject(error);
          } else {
            console.log('Direct upload success:', result.secure_url);
            
            // Test immédiat de l'URL
            const https = require('https');
            const url = new URL(result.secure_url);
            
            https.get(url, (res) => {
              console.log('=== DIRECT UPLOAD URL TEST ===');
              console.log('URL:', result.secure_url);
              console.log('Status Code:', res.statusCode);
              console.log('Content-Type:', res.headers['content-type']);
              console.log('Content-Length:', res.headers['content-length']);
              
              if (res.statusCode === 200) {
                console.log('SUCCESS: Direct upload URL is accessible!');
              } else {
                console.error('ERROR: Direct upload URL returns', res.statusCode);
              }
              
              resolve(result);
            }).on('error', (err) => {
              console.error('ERROR testing direct upload URL:', err.message);
              resolve(result);
            });
          }
        }
      ).end(tempBuffer);
    });
    
    console.log('DIRECT UPLOAD FULL RESULT:', JSON.stringify(directResult, null, 2));
    console.log('DIRECT UPLOAD KEY FIELDS:', {
      secure_url: directResult.secure_url,
      url: directResult.url,
      resource_type: directResult.resource_type,
      type: directResult.type,
      access_mode: directResult.access_mode,
      public_id: directResult.public_id,
      format: directResult.format
    });

    // Test avec signed URL (alternative)
    console.log('=== SIGNED URL TEST ===');
    try {
      const signedUrl = cloudinary.utils.url(directResult.public_id, {
        resource_type: directResult.resource_type,
        type: 'upload',
        secure: true,
        sign_url: true
      });
      
      console.log('SIGNED URL:', signedUrl);
      
      // Test de la signed URL
      const https = require('https');
      const signedUrlObj = new URL(signedUrl);
      
      https.get(signedUrlObj, (res) => {
        console.log('=== SIGNED URL TEST RESULT ===');
        console.log('Signed URL Status:', res.statusCode);
        console.log('Signed URL Content-Type:', res.headers['content-type']);
        
        if (res.statusCode === 200) {
          console.log('SUCCESS: Signed URL works - Cloudinary requires signed URLs!');
        } else {
          console.log('INFO: Signed URL also returns', res.statusCode);
        }
      }).on('error', (err) => {
        console.error('ERROR testing signed URL:', err.message);
      });
    } catch (error) {
      console.error('ERROR generating signed URL:', error.message);
    }

    // Configure upload options based on type (upload normal)
    const uploadOptions = {
      folder: `gazette_${type}s`,
      resource_type: type === 'video' ? 'video' : 'auto',
      type: 'upload',
      access_mode: 'public',
    };
    
    console.log('Normal upload options:', uploadOptions);

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
            console.log('CLOUDINARY RESULT FULL:', JSON.stringify(result, null, 2));
            console.log('CLOUDINARY UPLOAD RESULT:', {
              public_id: result.public_id,
              resource_type: result.resource_type,
              type: result.type,
              access_mode: result.access_mode,
              url: result.url,
              secure_url: result.secure_url,
              format: result.format,
              original_filename: result.original_filename,
              bytes: result.bytes,
              created_at: result.created_at
            });
            resolve(result);
          }
        }
      ).end(req.file.buffer);
    });

    console.log('TEST THIS URL DIRECTLY:', result.secure_url);
    
    // Test direct de l'URL juste après upload
    try {
      const https = require('https');
      const url = new URL(result.secure_url);
      
      const testResponse = await new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers
          });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      console.log('=== DIRECT URL TEST AFTER UPLOAD ===');
      console.log('URL:', result.secure_url);
      console.log('Status Code:', testResponse.statusCode);
      console.log('Content-Type:', testResponse.headers['content-type']);
      console.log('Content-Length:', testResponse.headers['content-length']);
      
      if (testResponse.statusCode === 200) {
        console.log('SUCCESS: URL is directly accessible after upload!');
      } else {
        console.error('ERROR: URL returns', testResponse.statusCode, 'immediately after upload!');
      }
    } catch (error) {
      console.error('ERROR testing URL directly:', error.message);
    }
    
    // Vérification format URL (mais plus critique que 401)
    if (result.secure_url.includes('/raw/upload/')) {
      console.log('INFO: URL contains /raw/upload/ - this may be normal for PDFs');
    } else if (result.secure_url.includes('/image/upload/')) {
      console.log('INFO: URL contains /image/upload/ - PDF delivered as image');
    } else {
      console.log('WARNING: Unexpected URL format:', result.secure_url);
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
