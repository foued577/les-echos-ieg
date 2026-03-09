const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');

// Connexion à la base de données
const mongoURI = 'mongodb://localhost:27017/ieg';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Connecté à MongoDB');
    
    try {
      // Récupérer l'utilisateur admin
      const user = await User.findOne({ email: 'admin@ieg.com' });
      
      if (!user) {
        console.log('❌ Utilisateur admin non trouvé');
        return;
      }
      
      console.log('✅ Utilisateur trouvé:', user.email);
      console.log('🆔 User ID:', user._id);
      console.log('🔑 Role:', user.role);
      
      // Générer un token JWT avec le bon secret
      const token = jwt.sign(
        { id: user._id, role: user.role },
        'votre_super_cle_secrete_jw', // Le vrai secret du .env
        { expiresIn: '7d' }
      );
      
      console.log('🎫 Token JWT généré:');
      console.log(token);
      
    } catch (error) {
      console.error('💥 Erreur:', error);
    }
    
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  });
