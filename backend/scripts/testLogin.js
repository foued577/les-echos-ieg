const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Testing login...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'yousfifouede@gmail.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
    if (response.data.success) {
      console.log('🔑 Token:', response.data.data.token.substring(0, 50) + '...');
      console.log('👤 User:', {
        id: response.data.data._id,
        name: response.data.data.name,
        email: response.data.data.email,
        role: response.data.data.role
      });
    }
  } catch (error) {
    console.error('❌ Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testLogin();
