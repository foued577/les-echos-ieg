const mongoose = require('mongoose');
const Team = require('./models/Team');

// Configuration MongoDB directe
const MONGODB_URI = 'mongodb://localhost:27017/ieg-echos';

async function fixTeamColors() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Update ALL teams to have default color
    const result = await Team.updateMany(
      {}, // All teams
      { $set: { color: '#64748b' } }, // Set default color
      { upsert: false }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} teams with default color`);

    // Verify the update
    const teams = await Team.find({});
    console.log('🎨 All teams after update:');
    teams.forEach(team => {
      console.log(`  - ${team.name}: ${team.color}`);
    });

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

fixTeamColors();
