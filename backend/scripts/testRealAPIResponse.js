const mongoose = require('mongoose');
const Rubrique = require('../models/Rubrique');

async function testRealAPIResponse() {
  try {
    console.log('🔍 Testing real API response...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    // Test exactly like backend API
    console.log('\n--- Real Backend API Response ---');
    const rubriques = await Rubrique.find({})
      .populate('team_ids', 'name')
      .populate('created_by', 'name email avatar');

    console.log('API Response structure:');
    rubriques.forEach((rubrique, index) => {
      console.log(`\n${index + 1}. ${rubrique.name}:`);
      console.log(`   _id: ${rubrique._id} (${typeof rubrique._id})`);
      console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)} (${typeof rubrique.team_ids})`);
      
      if (rubrique.team_ids && rubrique.team_ids.length > 0) {
        console.log(`   team_ids[0]: ${JSON.stringify(rubrique.team_ids[0])}`);
        console.log(`   team_ids[0]._id: ${rubrique.team_ids[0]._id} (${typeof rubrique.team_ids[0]._id})`);
        console.log(`   team_ids[0].name: ${rubrique.team_ids[0].name}`);
        console.log(`   Is team_ids[0] an object? ${typeof rubrique.team_ids[0] === 'object'}`);
      }
    });
    
    // Test what frontend receives
    console.log('\n--- Frontend Processing ---');
    const apiResponse = {
      success: true,
      data: rubriques
    };
    
    const normalizedRubriques = apiResponse.data.map(rubrique => ({
      ...rubrique,
      id: rubrique._id || rubrique.id
    }));
    
    console.log('Normalized rubriques:');
    normalizedRubriques.forEach((rubrique, index) => {
      console.log(`\n${index + 1}. ${rubrique.name}:`);
      console.log(`   id: ${rubrique.id} (${typeof rubrique.id})`);
      console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)} (${typeof rubrique.team_ids})`);
      
      if (rubrique.team_ids && rubrique.team_ids.length > 0) {
        console.log(`   team_ids[0]._id: ${rubrique.team_ids[0]._id} (${typeof rubrique.team_ids[0]._id})`);
        console.log(`   team_ids[0].name: ${rubrique.team_ids[0].name}`);
      }
    });
    
    // Test filtering with real data
    console.log('\n--- Filtering Test ---');
    const selectedTeamId = '699edc60c2c3cd530951cf06'; // String from frontend Select
    console.log(`Selected team ID (string): ${selectedTeamId} (${typeof selectedTeamId})`);
    
    const filteredRubriques = normalizedRubriques.filter(rubrique => {
      const matchesTeam = rubrique.team_ids && rubrique.team_ids.some(teamObj => 
        teamObj._id.toString() === selectedTeamId
      );
      console.log(`Rubrique "${rubrique.name}": matchesTeam = ${matchesTeam}`);
      return matchesTeam;
    });
    
    console.log(`\n✅ Filtered result: ${filteredRubriques.length} rubriques`);
    filteredRubriques.forEach(r => console.log(`  - ${r.name}`));
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testRealAPIResponse();
