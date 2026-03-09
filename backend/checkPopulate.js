const mongoose = require('mongoose');
const Content = require('./models/Content');
const Team = require('./models/Team');
const Rubrique = require('./models/Rubrique');
const User = require('./models/User'); // Add this line

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/les-echos-ieg', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const checkPopulate = async () => {
  try {
    console.log('🔍=== TEST POPULATE ===');
    
    // Test avec populate
    const contents = await Content.find({ status: 'approved' })
      .populate('author_id', 'name email avatar')
      .populate('team_ids', 'name')
      .populate('rubrique_id', 'name description color')
      .limit(3);
    
    console.log(`📋 Found ${contents.length} approved contents`);
    
    contents.forEach((content, index) => {
      console.log(`\n📄 Content ${index + 1}: "${content.title}"`);
      console.log(`  author_id: ${JSON.stringify(content.author_id)}`);
      console.log(`  team_ids: ${JSON.stringify(content.team_ids)}`);
      console.log(`  rubrique_id: ${JSON.stringify(content.rubrique_id)}`);
    });
    
    // Vérifier si les références existent
    console.log('\n🔍=== VÉRIFICATION DES RÉFÉRENCES ===');
    
    const teams = await Team.find();
    const rubriques = await Rubrique.find();
    
    console.log(`Teams in DB: ${teams.length}`);
    console.log(`Rubriques in DB: ${rubriques.length}`);
    
    teams.forEach(team => {
      console.log(`  Team: ${team.name} (${team._id})`);
    });
    
    rubriques.forEach(rubrique => {
      console.log(`  Rubrique: ${rubrique.name} (${rubrique._id})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkPopulate();
