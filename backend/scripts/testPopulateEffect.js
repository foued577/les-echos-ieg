const mongoose = require('mongoose');

async function testPopulateEffect() {
  try {
    console.log('🔍 Testing populate effect on team_ids...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Test without populate
    console.log('\n--- WITHOUT populate ---');
    const rubriquesRaw = await db.collection('rubriques').find({}).toArray();
    rubriquesRaw.forEach((rubrique, index) => {
      console.log(`${index + 1}. ${rubrique.name}:`);
      console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)} (${typeof rubrique.team_ids})`);
      if (rubrique.team_ids) {
        console.log(`   team_ids[0] type: ${typeof rubrique.team_ids[0]}`);
      }
    });
    
    // Test with populate (like backend API)
    console.log('\n--- WITH populate (like backend) ---');
    const Rubrique = mongoose.model('Rubrique', new mongoose.Schema({}, {collection: 'rubriques'}));
    const rubriquesPopulated = await Rubrique.find({}).populate('team_ids', 'name');
    
    rubriquesPopulated.forEach((rubrique, index) => {
      console.log(`${index + 1}. ${rubrique.name}:`);
      console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)} (${typeof rubrique.team_ids})`);
      if (rubrique.team_ids && rubrique.team_ids[0]) {
        console.log(`   team_ids[0]: ${JSON.stringify(rubrique.team_ids[0])}`);
        console.log(`   team_ids[0]._id: ${rubrique.team_ids[0]._id} (${typeof rubrique.team_ids[0]._id})`);
        console.log(`   team_ids[0].name: ${rubrique.team_ids[0].name}`);
      }
    });
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testPopulateEffect();
