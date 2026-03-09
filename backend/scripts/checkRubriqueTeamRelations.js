const mongoose = require('mongoose');
const Rubrique = require('../models/Rubrique');
const Team = require('../models/Team');

async function checkRubriqueTeamRelations() {
  try {
    console.log('🔍 Checking rubrique-team relations...');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    // Get all rubriques with teams populated
    const rubriques = await Rubrique.find({}).populate('teams');
    console.log(`📋 Found ${rubriques.length} rubriques:`);
    
    rubriques.forEach((rubrique, index) => {
      console.log(`\n${index + 1}. Rubrique: "${rubrique.name}"`);
      console.log(`   _id: ${rubrique._id}`);
      console.log(`   teams field:`, rubrique.teams);
      console.log(`   team_ids field:`, rubrique.team_ids);
      console.log(`   teams type: ${typeof rubrique.teams}`);
      console.log(`   team_ids type: ${typeof rubrique.team_ids}`);
      
      if (rubrique.teams && Array.isArray(rubrique.teams)) {
        rubrique.teams.forEach((team, teamIndex) => {
          console.log(`   Team ${teamIndex + 1}:`);
          console.log(`     _id: ${team._id}`);
          console.log(`     name: ${team.name}`);
          console.log(`     type: ${typeof team}`);
        });
      }
    });
    
    // Get all teams
    const teams = await Team.find({});
    console.log(`\n🏢 Found ${teams.length} teams:`);
    
    teams.forEach((team, index) => {
      console.log(`${index + 1}. Team: "${team.name}" (_id: ${team._id})`);
    });
    
    // Test filtering logic
    console.log('\n🔍 Testing filtering logic...');
    const selectedTeamId = teams[0]?._id?.toString();
    console.log(`Selected team ID: ${selectedTeamId}`);
    
    const filteredRubriques = rubriques.filter(rubrique => {
      const teamIds = rubrique.teams?.map(team => team._id?.toString()) || [];
      console.log(`Rubrique "${rubrique.name}" team IDs:`, teamIds);
      console.log(`Includes selected team? ${teamIds.includes(selectedTeamId)}`);
      return teamIds.includes(selectedTeamId);
    });
    
    console.log(`\n✅ Filtered rubriques: ${filteredRubriques.length}`);
    filteredRubriques.forEach(r => console.log(`  - ${r.name}`));
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkRubriqueTeamRelations();
