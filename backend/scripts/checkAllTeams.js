const mongoose = require('mongoose');
const Team = require('../models/Team');
require('dotenv').config();

// Connexion à la base de données
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur de connexion:', err));

// Vérifier toutes les équipes
const checkAllTeams = async () => {
  try {
    console.log('🔍 Vérification de toutes les équipes...');
    
    // Compter toutes les équipes
    const count = await Team.countDocuments();
    console.log(`📊 Nombre total d'équipes: ${count}`);
    
    // Afficher toutes les équipes avec détails
    const teams = await Team.find({});
    console.log('📋 Toutes les équipes:');
    teams.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.name} (${team._id})`);
      console.log(`     Description: ${team.description}`);
      console.log(`     Members: ${team.members?.length || 0} membres`);
      console.log(`     Created: ${team.createdAt}`);
      console.log('');
    });
    
    // Simuler la réponse API
    const apiResponse = {
      success: true,
      count: teams.length,
      data: teams.map(t => ({
        _id: t._id,
        name: t.name,
        description: t.description,
        members: t.members,
        created_at: t.createdAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }))
    };
    
    console.log('📤 Réponse API simulée:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('💥 Erreur:', error);
  } finally {
    mongoose.disconnect();
  }
};

checkAllTeams();
