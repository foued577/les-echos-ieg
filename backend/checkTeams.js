const mongoose = require('mongoose');
const Team = require('./models/Team');

// Configuration MongoDB directe
const MONGODB_URI = 'mongodb://localhost:27017/ieg-echos';

async function checkTeams() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Collections found:', collections.map(c => c.name));

    // Check teams
    const teams = await Team.find({});
    console.log(`📊 Teams found: ${teams.length}`);
    
    if (teams.length > 0) {
      console.log('🎨 Teams details:');
      teams.forEach(team => {
        console.log(`  - ${team.name}: color=${team.color || 'UNDEFINED'}`);
        console.log(`    ID: ${team._id}`);
        console.log(`    Description: ${team.description}`);
      });
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

checkTeams();
