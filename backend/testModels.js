const mongoose = require('mongoose');
const Team = require('./models/Team');
const TeamMember = require('./models/TeamMember');

// Connexion directe à la base de données
const mongoURI = 'mongodb://localhost:27017/ieg';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ Connecté à MongoDB');
    
    try {
      // Tester une simple requête Team
      console.log('🔍 Testing Team model...');
      const teams = await Team.find({});
      console.log(`📊 Found ${teams.length} teams`);
      
      teams.forEach(team => {
        console.log(`  - ${team.name} (${team._id})`);
      });
      
      // Tester TeamMember
      console.log('🔍 Testing TeamMember model...');
      const teamMembers = await TeamMember.find({});
      console.log(`👥 Found ${teamMembers.length} team members`);
      
      // Tester countDocuments
      console.log('🔍 Testing countDocuments...');
      const membersCount = await TeamMember.countDocuments();
      console.log(`📈 Total team members: ${membersCount}`);
      
    } catch (error) {
      console.error('💥 Error during test:', error);
    }
    
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  });
