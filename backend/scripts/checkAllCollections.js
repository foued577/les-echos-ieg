const mongoose = require('mongoose');
const Rubrique = require('../models/Rubrique');
const Team = require('../models/Team');

async function checkAllCollections() {
  try {
    console.log('🔍 Checking all collections...');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    // Check all collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Available collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Get all teams
    const teams = await Team.find({});
    console.log(`\n🏢 Found ${teams.length} teams:`);
    teams.forEach((team, index) => {
      console.log(`${index + 1}. Team: "${team.name}" (_id: ${team._id})`);
    });
    
    // Get all rubriques (try different collection names)
    let rubriques = [];
    try {
      rubriques = await Rubrique.find({});
      console.log(`\n📋 Found ${rubriques.length} rubriques from Rubrique model:`);
    } catch (error) {
      console.log('\n❌ Error with Rubrique model, trying direct collection access...');
      
      // Try direct collection access
      const rubriqueCollection = db.collection('rubriques');
      rubriques = await rubriqueCollection.find({}).toArray();
      console.log(`\n📋 Found ${rubriques.length} rubriques from rubriques collection:`);
    }
    
    rubriques.forEach((rubrique, index) => {
      console.log(`\n${index + 1}. Rubrique: "${rubrique.name}"`);
      console.log(`   _id: ${rubrique._id}`);
      console.log(`   teams: ${JSON.stringify(rubrique.teams)}`);
      console.log(`   team_ids: ${JSON.stringify(rubrique.team_ids)}`);
    });
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkAllCollections();
