const mongoose = require('mongoose');

async function debugTeamCollection() {
  try {
    console.log('🔍 Debugging team collection...');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Available collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check teams collection
    const teamsCollection = db.collection('teams');
    const count = await teamsCollection.countDocuments();
    console.log(`\n📊 Teams count: ${count}`);
    
    if (count > 0) {
      const teams = await teamsCollection.find({}).toArray();
      console.log('\n🏢 Teams found:');
      teams.forEach((team, index) => {
        console.log(`${index + 1}. Team: "${team.name}" (_id: ${team._id})`);
      });
    } else {
      console.log('\n❌ No teams found! Creating test teams...');
      
      const testTeams = [
        {
          name: 'aa',
          description: 'aa',
          members: [],
          created_at: new Date()
        },
        {
          name: 'bb',
          description: 'bb',
          members: [],
          created_at: new Date()
        }
      ];
      
      await teamsCollection.insertMany(testTeams);
      console.log('✅ Created test teams');
      
      // Verify
      const newTeams = await teamsCollection.find({}).toArray();
      console.log('\n🏢 New teams:');
      newTeams.forEach((team, index) => {
        console.log(`${index + 1}. Team: "${team.name}" (_id: ${team._id})`);
      });
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugTeamCollection();
