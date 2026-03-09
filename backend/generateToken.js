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
      
      // Générer un token JWT
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'votre_secret_par_defaut',
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
