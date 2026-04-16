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

    // Test ultra-minimal (zéro abstraction)
    console.log('=== ULTRA MINIMAL UPLOAD TEST ===');
    try {
      // Écrire le buffer dans un fichier temporaire
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `test-${Date.now()}.pdf`);
      
      fs.writeFileSync(tempFilePath, req.file.buffer);
      console.log('Temp file written:', tempFilePath);
      
      // Upload ultra-minimal avec cloudinary.uploader.upload
      const minimalResult = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: 'auto',
        type: 'upload',
        access_mode: 'public',
        folder: 'ultra-minimal-test'
      });
      
      console.log('=== MINIMAL UPLOAD RESULT ===');
      console.log('CLOUDINARY RESULT FULL:', JSON.stringify(minimalResult, null, 2));
      console.log('=== MINIMAL UPLOAD KEY FIELDS ===');
      console.log('secure_url:', minimalResult.secure_url);
      console.log('url:', minimalResult.url);
      console.log('resource_type:', minimalResult.resource_type);
      console.log('type:', minimalResult.type);
      console.log('access_mode:', minimalResult.access_mode);
      console.log('public_id:', minimalResult.public_id);
      console.log('format:', minimalResult.format);
      
      // Test immédiat de l'URL minimal
      const https = require('https');
      const minimalUrl = new URL(minimalResult.secure_url);
      
      const minimalTest = await new Promise((resolve) => {
        const req = https.get(minimalUrl, (res) => {
          console.log('=== MINIMAL URL TEST ===');
          console.log('URL:', minimalResult.secure_url);
          console.log('Status Code:', res.statusCode);
          console.log('Content-Type:', res.headers['content-type']);
          console.log('Content-Length:', res.headers['content-length']);
          console.log('Response Headers:', res.headers);
          
          if (res.statusCode === 200) {
            console.log('SUCCESS: Minimal upload URL is accessible!');
          } else {
            console.error('ERROR: Minimal upload URL returns', res.statusCode);
          }
          
          resolve(res.statusCode);
        });
        
        req.on('error', (err) => {
          console.error('ERROR testing minimal URL:', err.message);
          resolve(500);
        });
        
        req.setTimeout(10000, () => {
          req.destroy();
          console.error('TIMEOUT testing minimal URL');
          resolve(408);
        });
      });
      
      // Nettoyer le fichier temporaire
      fs.unlinkSync(tempFilePath);
      console.log('Temp file cleaned up');
      
      console.log('=== MINIMAL TEST CONCLUSION ===');
      if (minimalTest === 200) {
        console.log('✅ CONCLUSION: Cloudinary CAN deliver files publicly');
        console.log('❌ PROBLEM: The issue is in the upload pipeline/middleware');
      } else {
        console.log('❌ CONCLUSION: Cloudinary CANNOT deliver files publicly');
        console.log('❌ PROBLEM: Cloudinary account/settings/security issue');
      }
      
    } catch (minimalError) {
      console.error('ERROR in minimal upload test:', minimalError);
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
