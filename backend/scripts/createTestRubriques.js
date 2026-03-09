const mongoose = require('mongoose');

async function createTestRubriques() {
  try {
    console.log('🔨 Creating test rubriques...');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ieg');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get teams
    const teamsCollection = db.collection('teams');
    const teams = await teamsCollection.find({}).toArray();
    console.log(`\n🏢 Found ${teams.length} teams:`);
    teams.forEach((team, index) => {
      console.log(`${index + 1}. Team: "${team.name}" (_id: ${team._id})`);
    });
    
    if (teams.length === 0) {
      console.log('❌ No teams found! Please create teams first.');
      return;
    }
    
    // Create test rubriques
    const rubriquesCollection = db.collection('rubriques');
    
    const testRubriques = [
      {
        name: 'Marketing',
        description: 'Marketing et communication',
        color: '#0f766e',
        teams: [teams[0]._id],
        team_ids: [teams[0]._id],
        created_at: new Date()
      },
      {
        name: 'Technique',
        description: 'Documentation technique',
        color: '#1d4ed8',
        teams: [teams[1]._id],
        team_ids: [teams[1]._id],
        created_at: new Date()
      },
      {
        name: 'Général',
        description: 'Contenu général',
        color: '#7c3aed',
        teams: teams.map(t => t._id),
        team_ids: teams.map(t => t._id),
        created_at: new Date()
      }
    ];
    
    await rubriquesCollection.insertMany(testRubriques);
    console.log(`\n✅ Created ${testRubriques.length} test rubriques:`);
    
    // Verify creation
    const allRubriques = await rubriquesCollection.find({}).toArray();
    console.log(`\n📋 Total rubriques in DB: ${allRubriques.length}`);
    allRubriques.forEach((rubrique, index) => {
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

createTestRubriques();
