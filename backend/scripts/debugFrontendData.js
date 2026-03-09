const mongoose = require('mongoose');

async function debugFrontendData() {
  try {
    console.log('🔍 Debugging frontend data flow...');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Test API response format
    console.log('\n📡 Testing API response format...');
    
    // Simulate teamsAPI.getAll()
    const teamsCollection = db.collection('teams');
    const teams = await teamsCollection.find({}).toArray();
    
    const teamsAPIResponse = {
      success: true,
      data: teams.map(team => ({
        ...team,
        id: team._id || team.id
      }))
    };
    
    console.log('Teams API Response:');
    console.log(JSON.stringify(teamsAPIResponse, null, 2));
    
    // Simulate rubriquesAPI.getAll()
    const rubriquesCollection = db.collection('rubriques');
    const rubriques = await rubriquesCollection.find({}).toArray();
    
    const rubriquesAPIResponse = {
      success: true,
      data: rubriques.map(rubrique => ({
        ...rubrique,
        id: rubrique._id || rubrique.id
      }))
    };
    
    console.log('\nRubriques API Response:');
    console.log(JSON.stringify(rubriquesAPIResponse, null, 2));
    
    // Test frontend filtering with actual API response format
    console.log('\n🔍 Testing frontend filtering with API response...');
    
    if (teamsAPIResponse.success && rubriquesAPIResponse.success) {
      const normalizedTeams = teamsAPIResponse.data.map(team => ({
        ...team,
        id: team._id || team.id
      }));
      
      const normalizedRubriques = rubriquesAPIResponse.data.map(rubrique => ({
        ...rubrique,
        id: rubrique._id || rubrique.id
      }));
      
      console.log('\nNormalized teams:');
      normalizedTeams.forEach((team, index) => {
        console.log(`${index + 1}. Team: "${team.name}" (id: ${team.id} - ${typeof team.id})`);
      });
      
      console.log('\nNormalized rubriques:');
      normalizedRubriques.forEach((rubrique, index) => {
        console.log(`${index + 1}. Rubrique: "${rubrique.name}"`);
        console.log(`   id: ${rubrique.id} (${typeof rubrique.id})`);
        console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)} (${typeof rubrique.team_ids})`);
        if (rubrique.team_ids) {
          console.log(`   team_ids types: [${rubrique.team_ids.map(t => typeof t).join(', ')}]`);
        }
      });
      
      // Test Rubriques.jsx filtering
      console.log('\n--- Rubriques.jsx filtering test ---');
      const selectedTeam = normalizedTeams[0];
      const selectedTeamId = selectedTeam.id;
      console.log(`Selected team: "${selectedTeam.name}" (id: ${selectedTeamId} - ${typeof selectedTeamId})`);
      
      const filteredRubriques = normalizedRubriques.filter(rubrique => {
        const matchesTeam = selectedTeamId === 'all' || 
          (rubrique.team_ids && rubrique.team_ids.some(id => id.toString() === selectedTeamId));
        console.log(`Rubrique "${rubrique.name}": team_ids=${JSON.stringify(rubrique.team_ids)} some(id.toString() === ${selectedTeamId}) = ${matchesTeam}`);
        return matchesTeam;
      });
      
      console.log(`\nFiltered result: ${filteredRubriques.length} rubriques`);
      filteredRubriques.forEach(r => console.log(`  - ${r.name}`));
      
      // Test CreateContent.jsx filtering
      console.log('\n--- CreateContent.jsx filtering test ---');
      const selectedTeamIds = [selectedTeamId];
      console.log(`Selected team IDs: [${selectedTeamIds.join(', ')}]`);
      
      const filteredCategories = normalizedRubriques.filter(c => {
        if (!selectedTeamIds || selectedTeamIds.length === 0) return false;
        
        const hasIntersection = c.team_ids && c.team_ids.some(rubriqueTeamId => 
          selectedTeamIds.some(selectedTeamId => rubriqueTeamId.toString() === selectedTeamId)
        );
        console.log(`Rubrique "${c.name}": hasIntersection = ${hasIntersection}`);
        return hasIntersection;
      });
      
      console.log(`\nFiltered categories: ${filteredCategories.length} rubriques`);
      filteredCategories.forEach(c => console.log(`  - ${c.name}`));
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugFrontendData();
