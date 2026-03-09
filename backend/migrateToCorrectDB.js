const mongoose = require('mongoose');
const TeamMember = require('./models/TeamMember');
const User = require('./models/User');
const Team = require('./models/Team');

// Connexion à la bonne base de données
const mongoURI = 'mongodb://localhost:27017/les-echos-ieg';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Connecté à la bonne base: les-echos-ieg');
    
    try {
      // Récupérer tous les utilisateurs
      const users = await User.find({});
      console.log(`👥 Found ${users.length} users`);
      
      // Récupérer toutes les équipes
      const teams = await Team.find({});
      console.log(`🏢 Found ${teams.length} teams`);
      
      // Pour chaque utilisateur, l'ajouter comme membre de toutes les équipes
      for (const user of users) {
        for (const team of teams) {
          // Vérifier si la relation existe déjà
          const existingMember = await TeamMember.findOne({
            team_id: team._id,
            user_id: user._id
          });
          
          if (!existingMember) {
            // Créer la relation
            await TeamMember.create({
              team_id: team._id,
              user_id: user._id,
              role: user.role === 'ADMIN' ? 'admin' : 'member'
            });
            
            console.log(`✅ Added ${user.email} as member of team "${team.name}"`);
          } else {
            console.log(`ℹ️ ${user.email} is already member of team "${team.name}"`);
          }
        }
      }
      
      console.log('🎉 Migration completed successfully!');
      
      // Vérification finale
      const finalTeams = await Team.find({});
      for (const team of finalTeams) {
        const memberCount = await TeamMember.countDocuments({ team_id: team._id });
        console.log(`📊 Final count - Team: ${team.name} | Members: ${memberCount}`);
      }
      
    } catch (error) {
      console.error('💥 Error during migration:', error);
    }
    
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  });
