const mongoose = require('mongoose');
const Team = require('./backend/models/Team');
const User = require('./backend/models/User');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/ieg', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixExistingTeams() {
  try {
    console.log('🔧=== FIXING EXISTING TEAMS ===');
    
    // Récupérer tous les utilisateurs
    const users = await User.find({});
    console.log('👥 Found users:', users.length);
    
    if (users.length === 0) {
      console.log('❌ No users found');
      return;
    }
    
    // Utiliser le premier utilisateur comme créateur par défaut
    const defaultCreator = users[0];
    console.log('👤 Using default creator:', defaultCreator.email);
    
    // Récupérer toutes les équipes sans membres
    const teamsWithoutMembers = await Team.find({ 
      members: { $size: 0 } 
    });
    
    console.log('🔍 Teams without members:', teamsWithoutMembers.length);
    
    for (const team of teamsWithoutMembers) {
      console.log(`🔧 Adding ${defaultCreator.email} to team: ${team.name}`);
      
      // Ajouter le créateur comme membre
      team.members.push(defaultCreator._id);
      await team.save();
      
      console.log(`✅ Updated team: ${team.name}`);
    }
    
    console.log('🎉=== ALL TEAMS FIXED ===');
    
  } catch (error) {
    console.error('❌ Error fixing teams:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixExistingTeams();
