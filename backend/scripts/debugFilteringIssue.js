const mongoose = require('mongoose');

async function debugFilteringIssue() {
  try {
    console.log('🔍 Debugging filtering issue...');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all teams
    const teamsCollection = db.collection('teams');
    const teams = await teamsCollection.find({}).toArray();
    console.log(`\n🏢 Found ${teams.length} teams:`);
    teams.forEach((team, index) => {
      console.log(`${index + 1}. Team: "${team.name}" (_id: ${team._id}) type: ${typeof team._id}`);
    });
    
    // Get all rubriques
    const rubriquesCollection = db.collection('rubriques');
    const rubriques = await rubriquesCollection.find({}).toArray();
    console.log(`\n📋 Found ${rubriques.length} rubriques:`);
    rubriques.forEach((rubrique, index) => {
      console.log(`\n${index + 1}. Rubrique: "${rubrique.name}"`);
      console.log(`   _id: ${rubrique._id} (${typeof rubrique._id})`);
      console.log(`   teams: ${JSON.stringify(rubrique.teams)} (${typeof rubrique.teams})`);
      console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)} (${typeof rubrique.team_ids})`);
      
      if (rubrique.teams && Array.isArray(rubrique.teams)) {
        console.log(`   teams array types: ${rubrique.teams.map(t => typeof t)}`);
      }
      if (rubrique.team_ids && Array.isArray(rubrique.team_ids)) {
        console.log(`   team_ids array types: ${rubrique.team_ids.map(t => typeof t)}`);
      }
    });
    
    // Test filtering exactly like frontend
    console.log('\n🔍 Testing filtering like frontend...');
    
    if (teams.length > 0 && rubriques.length > 0) {
      const selectedTeam = teams[0];
      const selectedTeamId = selectedTeam._id.toString();
      console.log(`\nSelected team: "${selectedTeam.name}"`);
      console.log(`Selected team ID (string): ${selectedTeamId} (${typeof selectedTeamId})`);
      console.log(`Selected team ID (ObjectId): ${selectedTeam._id} (${typeof selectedTeam._id})`);
      
      // Test 1: Rubriques.jsx filtering logic
      console.log('\n--- Test 1: Rubriques.jsx filtering ---');
      const filteredRubriques1 = rubriques.filter(rubrique => {
        const matchesTeam = rubrique.team_ids && rubrique.team_ids.includes(selectedTeamId);
        console.log(`Rubrique "${rubrique.name}": team_ids=${JSON.stringify(rubrique.team_ids)} includes ${selectedTeamId} = ${matchesTeam}`);
        return matchesTeam;
      });
      console.log(`Result: ${filteredRubriques1.length} rubriques`);
      filteredRubriques1.forEach(r => console.log(`  - ${r.name}`));
      
      // Test 2: Try with ObjectId
      console.log('\n--- Test 2: With ObjectId ---');
      const filteredRubriques2 = rubriques.filter(rubrique => {
        const matchesTeam = rubrique.team_ids && rubrique.team_ids.some(id => id.toString() === selectedTeamId);
        console.log(`Rubrique "${rubrique.name}": team_ids=${JSON.stringify(rubrique.team_ids)} some(id.toString() === ${selectedTeamId}) = ${matchesTeam}`);
        return matchesTeam;
      });
      console.log(`Result: ${filteredRubriques2.length} rubriques`);
      filteredRubriques2.forEach(r => console.log(`  - ${r.name}`));
      
      // Test 3: CreateContent.jsx filtering logic
      console.log('\n--- Test 3: CreateContent.jsx filtering ---');
      const selectedTeamIds = [selectedTeamId];
      const filteredRubriques3 = rubriques.filter(rubrique => {
        const hasIntersection = rubrique.team_ids && rubrique.team_ids.some(teamId => selectedTeamIds.includes(teamId));
        console.log(`Rubrique "${rubrique.name}": team_ids=${JSON.stringify(rubrique.team_ids)} some(teamId => [${selectedTeamIds}].includes(teamId)) = ${hasIntersection}`);
        return hasIntersection;
      });
      console.log(`Result: ${filteredRubriques3.length} rubriques`);
      filteredRubriques3.forEach(r => console.log(`  - ${r.name}`));
      
      // Test 4: Check what's actually in the arrays
      console.log('\n--- Test 4: Array content analysis ---');
      rubriques.forEach(rubrique => {
        console.log(`\nRubrique "${rubrique.name}":`);
        if (rubrique.team_ids) {
          console.log(`  team_ids array: [${rubrique.team_ids.join(', ')}]`);
          console.log(`  team_ids types: [${rubrique.team_ids.map(t => typeof t).join(', ')}]`);
          console.log(`  team_ids as strings: [${rubrique.team_ids.map(t => t.toString()).join(', ')}]`);
        }
      });
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugFilteringIssue();
