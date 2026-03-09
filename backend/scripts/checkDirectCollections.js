const mongoose = require('mongoose');

async function checkDirectCollections() {
  try {
    console.log('🔍 Checking collections directly...');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check teams collection
    const teamsCollection = db.collection('teams');
    const teams = await teamsCollection.find({}).toArray();
    console.log(`\n🏢 Found ${teams.length} teams:`);
    teams.forEach((team, index) => {
      console.log(`${index + 1}. Team: "${team.name}" (_id: ${team._id})`);
    });
    
    // Check rubriques collection
    const rubriquesCollection = db.collection('rubriques');
    const rubriques = await rubriquesCollection.find({}).toArray();
    console.log(`\n📋 Found ${rubriques.length} rubriques:`);
    rubriques.forEach((rubrique, index) => {
      console.log(`\n${index + 1}. Rubrique: "${rubrique.name}"`);
      console.log(`   _id: ${rubrique._id}`);
      console.log(`   teams: ${JSON.stringify(rubrique.teams)}`);
      console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)}`);
      console.log(`   teams type: ${typeof rubrique.teams}`);
      console.log(`   team_ids type: ${typeof rubrique.team_ids}`);
    });
    
    // Test filtering with actual data
    if (teams.length > 0 && rubriques.length > 0) {
      console.log('\n🔍 Testing filtering logic...');
      const selectedTeamId = teams[0]._id.toString();
      console.log(`Selected team ID: ${selectedTeamId}`);
      
      const filteredRubriques = rubriques.filter(rubrique => {
        console.log(`\nTesting rubrique: "${rubrique.name}"`);
        console.log(`  rubrique.teams: ${JSON.stringify(rubrique.teams)}`);
        console.log(`  rubrique.team_ids: ${JSON.stringify(rubrique.team_ids)}`);
        
        // Try different filtering approaches
        let matches = false;
        
        // Approach 1: Check team_ids array
        if (rubrique.team_ids && Array.isArray(rubrique.team_ids)) {
          const teamIdsAsStrings = rubrique.team_ids.map(id => id.toString());
          matches = teamIdsAsStrings.includes(selectedTeamId);
          console.log(`  team_ids approach: ${teamIdsAsStrings} includes ${selectedTeamId} = ${matches}`);
        }
        
        // Approach 2: Check teams array (if populated)
        if (!matches && rubrique.teams && Array.isArray(rubrique.teams)) {
          const teamIdsAsStrings = rubrique.teams.map(team => team._id?.toString() || team.toString());
          matches = teamIdsAsStrings.includes(selectedTeamId);
          console.log(`  teams approach: ${teamIdsAsStrings} includes ${selectedTeamId} = ${matches}`);
        }
        
        return matches;
      });
      
      console.log(`\n✅ Filtered rubriques: ${filteredRubriques.length}`);
      filteredRubriques.forEach(r => console.log(`  - ${r.name}`));
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkDirectCollections();
