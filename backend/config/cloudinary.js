const cloudinary = require('cloudinary').v2;

console.log('☁️ CLOUDINARY CONFIG DEBUG:');
console.log('- CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING');
console.log('- CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING');
console.log('- CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test configuration
try {
  console.log('☁️ Testing Cloudinary configuration...');
  // This will throw if config is invalid
  cloudinary.config().cloud_name && cloudinary.config().api_key && cloudinary.config().api_secret;
  console.log('✅ Cloudinary configuration loaded successfully');
} catch (error) {
  console.error('❌ Cloudinary configuration error:', error);
}

module.exports = cloudinary;
