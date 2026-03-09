const mongoose = require('mongoose');

async function checkRubriquesCollection() {
  try {
    console.log('🔍 Checking rubriques collection...');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const rubriquesCollection = db.collection('rubriques');
    const rubriques = await rubriquesCollection.find({}).toArray();
    
    console.log(`\n📋 Found ${rubriques.length} rubriques:`);
    rubriques.forEach((rubrique, index) => {
      console.log(`\n${index + 1}. Rubrique:`);
      console.log(`   _id: ${rubrique._id}`);
      console.log(`   name: ${rubrique.name}`);
      console.log(`   description: ${rubrique.description}`);
      console.log(`   teams: ${JSON.stringify(rubrique.teams)}`);
      console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)}`);
      console.log(`   created_at: ${rubrique.created_at}`);
    });
    
    if (rubriques.length === 0) {
      console.log('\n❌ No rubriques found! Creating test rubrique...');
      
      // Get teams first
      const teamsCollection = db.collection('teams');
      const teams = await teamsCollection.find({}).toArray();
      
      if (teams.length > 0) {
        const testRubrique = {
          name: 'Test Rubrique',
          description: 'Test description',
          color: '#0f766e',
          teams: [teams[0]._id],
          team_ids: [teams[0]._id],
          created_at: new Date()
        };
        
        await rubriquesCollection.insertOne(testRubrique);
        console.log('✅ Test rubrique created with team:', teams[0].name);
        
        // Check again
        const newRubriques = await rubriquesCollection.find({}).toArray();
        console.log(`\n📋 Now found ${newRubriques.length} rubriques:`);
        newRubriques.forEach((rubrique, index) => {
          console.log(`\n${index + 1}. Rubrique:`);
          console.log(`   _id: ${rubrique._id}`);
          console.log(`   name: ${rubrique.name}`);
          console.log(`   teams: ${JSON.stringify(rubrique.teams)}`);
          console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkRubriquesCollection();
