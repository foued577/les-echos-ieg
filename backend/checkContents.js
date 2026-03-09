const mongoose = require('mongoose');
const Content = require('./models/Content');

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/les-echos-ieg', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const checkContents = async () => {
  try {
    console.log('🔍=== VÉRIFICATION DIRECTE DES CONTENUS ===');
    
    // Récupérer TOUS les contenus sans populate
    const allContents = await Content.find({});
    
    console.log(`📋 Total contents: ${allContents.length}`);
    
    allContents.forEach((content, index) => {
      console.log(`\n📄 Content ${index + 1}: "${content.title}"`);
      console.log(`  _id: ${content._id}`);
      console.log(`  status: ${content.status}`);
      console.log(`  team_ids: ${JSON.stringify(content.team_ids)}`);
      console.log(`  rubrique_id: ${content.rubrique_id}`);
      console.log(`  author_id: ${content.author_id}`);
      console.log(`  created_at: ${content.created_at}`);
      console.log(`  ---`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkContents();
