const mongoose = require('mongoose');
const User = require('./models/User');

// Connexion directe à la base de données
const mongoURI = 'mongodb://localhost:27017/ieg';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Connecté à MongoDB');
    
    try {
      // Vérifier si des utilisateurs existent
      const users = await User.find({});
      console.log(`👥 Found ${users.length} users`);
      
      if (users.length === 0) {
        console.log('📝 Creating admin user...');
        
        // Créer un utilisateur admin par défaut
        const adminUser = await User.create({
          name: 'Admin User',
          email: 'admin@ieg.com',
          password: 'admin123',
          role: 'ADMIN'
        });
        
        console.log('✅ Admin user created:', adminUser.email);
        console.log('🔑 Password: admin123');
      } else {
        console.log('📋 Existing users:');
        users.forEach(user => {
          console.log(`  - ${user.email} (${user.role})`);
        });
      }
      
    } catch (error) {
      console.error('💥 Error:', error);
    }
    
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  });
