const mongoose = require('mongoose');

async function testFixedFiltering() {
  try {
    console.log('🔍 Testing fixed filtering logic...');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get data
    const teams = await db.collection('teams').find({}).toArray();
    const rubriques = await db.collection('rubriques').find({}).toArray();
    
    // Normalize like frontend
    const normalizedTeams = teams.map(team => ({
      ...team,
      id: team._id || team.id
    }));
    
    const normalizedRubriques = rubriques.map(rubrique => ({
      ...rubrique,
      id: rubrique._id || rubrique.id
    }));
    
    console.log('\n--- Testing with string selectedTeam ---');
    
    // Test with string selectedTeam (like Select with .toString())
    const selectedTeam = normalizedTeams[0];
    const selectedTeamId = selectedTeam.id.toString(); // Convert to string like SelectItem
    console.log(`Selected team: "${selectedTeam.name}" (id: ${selectedTeamId} - ${typeof selectedTeamId})`);
    
    const filteredRubriques = normalizedRubriques.filter(rubrique => {
      const matchesTeam = selectedTeamId === 'all' || 
        (rubrique.team_ids && rubrique.team_ids.some(id => id.toString() === selectedTeamId));
      console.log(`Rubrique "${rubrique.name}": team_ids=${JSON.stringify(rubrique.team_ids)} some(id.toString() === ${selectedTeamId}) = ${matchesTeam}`);
      return matchesTeam;
    });
    
    console.log(`\n✅ Filtered result: ${filteredRubriques.length} rubriques`);
    filteredRubriques.forEach(r => console.log(`  - ${r.name}`));
    
    console.log('\n--- Testing CreateContent filtering ---');
    
    const selectedTeamIds = [selectedTeamId];
    console.log(`Selected team IDs: [${selectedTeamIds.join(', ')}] (${typeof selectedTeamIds[0]})`);
    
    const filteredCategories = normalizedRubriques.filter(c => {
      if (!selectedTeamIds || selectedTeamIds.length === 0) return false;
      
      const hasIntersection = c.team_ids && c.team_ids.some(rubriqueTeamId => 
        selectedTeamIds.some(selectedTeamId => rubriqueTeamId.toString() === selectedTeamId)
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

testFixedFiltering();
