const mongoose = require('mongoose');
const Team = require('./models/Team');
require('dotenv').config();

async function updateExistingTeams() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Find all teams without color
    const teamsWithoutColor = await Team.find({ color: { $exists: false } });
    console.log(`📊 Found ${teamsWithoutColor.length} teams without color`);

    if (teamsWithoutColor.length > 0) {
      // Update all teams without color to have default color
      const result = await Team.updateMany(
        { color: { $exists: false } },
        { $set: { color: '#64748b' } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} teams with default color`);
    }

    // Show all teams with their colors
    const allTeams = await Team.find({});
    console.log('🎨 All teams with colors:');
    allTeams.forEach(team => {
      console.log(`  - ${team.name}: ${team.color || 'NO COLOR'}`);
    });

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

updateExistingTeams();
