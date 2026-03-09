const mongoose = require('mongoose');
const TeamMember = require('./models/TeamMember');
const User = require('./models/User');
const Team = require('./models/Team');

// Connexion directe à la base de données
const mongoURI = 'mongodb://localhost:27017/ieg';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Connecté à MongoDB');
    
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
      
    } catch (error) {
      console.error('💥 Error during migration:', error);
    }
    
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  });
