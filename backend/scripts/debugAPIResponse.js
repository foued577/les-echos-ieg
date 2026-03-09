const mongoose = require('mongoose');

async function debugAPIResponse() {
  try {
    console.log('🔍 Debugging API response format...');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check actual API response format
    console.log('\n📡 Checking /api/teams response...');
    const teams = await db.collection('teams').find({}).toArray();
    console.log('Teams raw from DB:');
    teams.forEach((team, index) => {
      console.log(`${index + 1}. _id: ${team._id} (${typeof team._id})`);
      console.log(`   name: ${team.name}`);
    });
    
    console.log('\n📡 Checking /api/rubriques response...');
    const rubriques = await db.collection('rubriques').find({}).toArray();
    console.log('Rubriques raw from DB:');
    rubriques.forEach((rubrique, index) => {
      console.log(`${index + 1}. _id: ${rubrique._id} (${typeof rubrique._id})`);
      console.log(`   name: ${rubrique.name}`);
      console.log(`   teams: ${JSON.stringify(rubrique.teams)} (${typeof rubrique.teams})`);
      console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)} (${typeof rubrique.team_ids})`);
      console.log(`   teamIds: ${JSON.stringify(rubrique.teamIds)} (${typeof rubrique.teamIds})`);
    });
    
    // Test backend filtering
    console.log('\n🔍 Testing backend filtering...');
    const teamId = teams[0]._id;
    console.log(`Filtering rubriques by teamId: ${teamId}`);
    
    const filteredRubriques = await db.collection('rubriques').find({
      team_ids: { $in: [teamId] }
    }).toArray();
    
    console.log(`Backend filtered result: ${filteredRubriques.length} rubriques`);
    filteredRubriques.forEach(r => console.log(`  - ${r.name}`));
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugAPIResponse();
