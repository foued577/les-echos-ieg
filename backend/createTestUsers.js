const mongoose = require('mongoose');
const User = require('./models/User');

// Connexion à la base de données
const mongoURI = 'mongodb://localhost:27017/les-echos-ieg';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Connecté à la base de données');
    
    try {
      // Créer des utilisateurs de test
      const testUsers = [
        {
          name: 'Alice Martin',
          email: 'alice.martin@test.com',
          role: 'MEMBER',
          password: 'password123'
        },
        {
          name: 'Bob Dubois',
          email: 'bob.dubois@test.com', 
          role: 'MEMBER',
          password: 'password123'
        },
        {
          name: 'Caroline Petit',
          email: 'caroline.petit@test.com',
          role: 'EDITOR',
          password: 'password123'
        },
        {
          name: 'David Bernard',
          email: 'david.bernard@test.com',
          role: 'MEMBER',
          password: 'password123'
        }
      ];

      for (const userData of testUsers) {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email: userData.email });
        
        if (!existingUser) {
          const user = await User.create(userData);
          console.log(`✅ Utilisateur créé: ${user.name} (${user.email})`);
        } else {
          console.log(`ℹ️ Utilisateur déjà existant: ${existingUser.name}`);
        }
      }

      console.log('🎉 Utilisateurs de test créés avec succès!');
      
      // Afficher tous les utilisateurs
      const allUsers = await User.find({});
      console.log(`📊 Total utilisateurs: ${allUsers.length}`);
      allUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
      });
      
    } catch (error) {
      console.error('💥 Erreur lors de la création des utilisateurs:', error);
    }
    
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  });
