const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connexion à la base de données
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur de connexion:', err));

// Mettre à jour le rôle de l'utilisateur
const updateUserRole = async () => {
  try {
    const email = 'yousfifouede@gmail.com';
    
    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé:', email);
      return;
    }
    
    console.log('👤 Utilisateur trouvé:', { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      currentRole: user.role 
    });
    
    // Mettre à jour le rôle en ADMIN
    const updatedUser = await User.findByIdAndUpdate(
      user._id, 
      { role: 'ADMIN' }, 
      { new: true }
    );
    
    console.log('✅ Rôle mis à jour:', {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      newRole: updatedUser.role
    });
    
  } catch (error) {
    console.error('💥 Erreur:', error);
  } finally {
    mongoose.disconnect();
  }
};

updateUserRole();
