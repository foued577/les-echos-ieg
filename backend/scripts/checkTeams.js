const mongoose = require('mongoose');
const Team = require('../models/Team');
require('dotenv').config();

// Connexion à la base de données
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur de connexion:', err));

// Vérifier les équipes dans la base
const checkTeams = async () => {
  try {
    console.log('🔍 Vérification de la collection teams...');
    
    // Compter toutes les équipes
    const count = await Team.countDocuments();
    console.log(`📊 Nombre total d'équipes: ${count}`);
    
    // Afficher toutes les équipes
    const teams = await Team.find({});
    console.log('📋 Toutes les équipes:', teams.map(t => ({
      _id: t._id,
      name: t.name,
      description: t.description,
      members: t.members,
      created_at: t.createdAt
    })));
    
    if (teams.length === 0) {
      console.log('⚠️ La collection teams est vide !');
      
      // Créer une équipe de test
      console.log('🔧 Création d\'une équipe de test...');
      const testTeam = await Team.create({
        name: 'Équipe Test',
        description: 'Équipe créée automatiquement pour test',
        members: []
      });
      console.log('✅ Équipe de test créée:', testTeam);
    } else {
      console.log('✅ Équipes trouvées dans la base');
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error);
  } finally {
    mongoose.disconnect();
  }
};

checkTeams();
