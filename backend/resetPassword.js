const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');
    
    const email = 'yousfifouede@gmail.com';
    const newPassword = 'password123';
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour l'utilisateur
    const result = await User.updateOne(
      { email },
      { password: hashedPassword }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Mot de passe réinitialisé avec succès');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Nouveau mot de passe: ${newPassword}`);
    } else {
      console.log('❌ Utilisateur non trouvé');
    }
    
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

resetPassword();
