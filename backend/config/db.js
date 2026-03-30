const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Timeout de connexion pour éviter le blocage
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000);
    });

    const connectPromise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    const conn = await Promise.race([connectPromise, timeoutPromise]);
    console.log(`✅ MongoDB Connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    // Ne pas quitter le processus en production, continuer sans DB
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    } else {
      console.log('⚠️ Production: Continue sans connexion MongoDB immédiate');
    }
  }
};

module.exports = connectDB;
