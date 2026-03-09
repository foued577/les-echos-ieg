const mongoose = require('mongoose');

// Define schemas like in backend
const teamSchema = new mongoose.Schema({
  name: String,
  description: String,
  members: [String],
  created_at: Date
});

const rubriqueSchema = new mongoose.Schema({
  name: String,
  description: String,
  team_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  color: String,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: Date
});

const Team = mongoose.model('Team', teamSchema);
const Rubrique = mongoose.model('Rubrique', rubriqueSchema);

async function testFixedBackend() {
  try {
    console.log('🔍 Testing fixed backend API...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    // Test NEW backend logic (without populate on team_ids)
    console.log('\n--- Fixed Backend API Response ---');
    const rubriques = await Rubrique.find({})
      .populate('created_by', 'name email avatar');

    // Convert team_ids to strings like fixed backend
    const formattedRubriques = rubriques.map(rubrique => ({
      ...rubrique.toObject(),
      team_ids: rubrique.team_ids.map(id => id.toString())
    }));

    console.log('Fixed API Response structure:');
    formattedRubriques.forEach((rubrique, index) => {
      console.log(`\n${index + 1}. ${rubrique.name}:`);
      console.log(`   _id: ${rubrique._id} (${typeof rubrique._id})`);
      console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)} (${typeof rubrique.team_ids})`);
      
      if (rubrique.team_ids && rubrique.team_ids.length > 0) {
        console.log(`   team_ids[0]: ${rubrique.team_ids[0]} (${typeof rubrique.team_ids[0]})`);
      }
    });
    
    // Test frontend filtering with fixed data
    console.log('\n--- Frontend Filtering Test ---');
    const selectedTeamId = '699edc60c2c3cd530951cf06'; // String from frontend Select
    console.log(`Selected team ID (string): ${selectedTeamId} (${typeof selectedTeamId})`);
    
    const filteredRubriques = formattedRubriques.filter(rubrique => {
      const matchesTeam = rubrique.team_ids && rubrique.team_ids.some(id => id === selectedTeamId);
      console.log(`Rubrique "${rubrique.name}": team_ids=${JSON.stringify(rubrique.team_ids)} includes ${selectedTeamId} = ${matchesTeam}`);
      return matchesTeam;
    });
    
    console.log(`\n✅ Filtered result: ${filteredRubriques.length} rubriques`);
    filteredRubriques.forEach(r => console.log(`  - ${r.name}`));
    
    // Test CreateContent filtering
    console.log('\n--- CreateContent Filtering Test ---');
    const selectedTeamIds = [selectedTeamId];
    console.log(`Selected team IDs: [${selectedTeamIds.join(', ')}]`);
    
    const filteredCategories = formattedRubriques.filter(c => {
      if (!selectedTeamIds || selectedTeamIds.length === 0) return false;
      
      const hasIntersection = c.team_ids && c.team_ids.some(rubriqueTeamId => 
        selectedTeamIds.some(selectedTeamId => rubriqueTeamId === selectedTeamId)
      );
      console.log(`Rubrique "${c.name}": hasIntersection = ${hasIntersection}`);
      return hasIntersection;
    });
    
    console.log(`\n✅ Filtered categories: ${filteredCategories.length} rubriques`);
    filteredCategories.forEach(c => console.log(`  - ${c.name}`));
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testFixedBackend();
