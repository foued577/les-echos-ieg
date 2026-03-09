const mongoose = require('mongoose');

// Configuration MongoDB - la bonne base de données
const MONGODB_URI = 'mongodb://localhost:27017/ieg';

// Définition du schéma Team (identique à votre modèle)
const teamSchema = new mongoose.Schema({
  name: String,
  description: String,
  color: String,
  members: [mongoose.Schema.Types.ObjectId],
  created_at: Date,
  createdAt: Date,
  updatedAt: Date,
  __v: Number
});

const Team = mongoose.model('Team', teamSchema);

async function fixTeamColors() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB (ieg database)');

    // Check current teams
    const teams = await Team.find({});
    console.log(`📊 Teams found: ${teams.length}`);
    
    console.log('🎨 Teams before update:');
    teams.forEach(team => {
      console.log(`  - ${team.name}: color=${team.color || 'UNDEFINED'}`);
    });

    // Update ALL teams to have default color
    const result = await Team.updateMany(
      {}, // All teams
      { $set: { color: '#64748b' } }, // Set default color
      { upsert: false }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} teams with default color`);

    // Verify the update
    const updatedTeams = await Team.find({});
    console.log('🎨 Teams after update:');
    updatedTeams.forEach(team => {
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
