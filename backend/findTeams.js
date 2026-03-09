const mongoose = require('mongoose');

// Test différentes bases de données possibles
const databases = [
  'mongodb://localhost:27017/ieg-echos',
  'mongodb://localhost:27017/ieg',
  'mongodb://localhost:27017/les-echos',
  'mongodb://localhost:27017/echos'
];

async function findTeams() {
  for (const dbUri of databases) {
    try {
      console.log(`\n🔍 Checking database: ${dbUri}`);
      await mongoose.connect(dbUri);
      
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📊 Collections:', collections.map(c => c.name));
      
      if (collections.some(c => c.name === 'teams')) {
        const teams = await mongoose.connection.db.collection('teams').find({}).toArray();
        console.log(`📊 Teams found: ${teams.length}`);
        
        if (teams.length > 0) {
          console.log('🎨 Sample team:', teams[0]);
          console.log('✅ FOUND TEAMS IN:', dbUri);
          await mongoose.disconnect();
          return;
        }
      }
      
      await mongoose.disconnect();
    } catch (error) {
      console.log(`❌ Error with ${dbUri}:`, error.message);
    }
  }
  
  console.log('\n❌ No teams found in any database');
}

findTeams();
