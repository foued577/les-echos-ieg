const mongoose = require('mongoose');
const Content = require('./models/Content');
const Team = require('./models/Team');
const Rubrique = require('./models/Rubrique');

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/les-echos-ieg', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateContents = async () => {
  try {
    console.log('🔧=== MISE À JOUR DES CONTENUS ===');
    
    // 1. Récupérer toutes les équipes et rubriques
    const teams = await Team.find();
    const rubriques = await Rubrique.find();
    
    console.log(`✅ Teams found: ${teams.length}`);
    console.log(`✅ Rubriques found: ${rubriques.length}`);
    
    if (teams.length === 0 || rubriques.length === 0) {
      console.log('❌ Pas de teams ou rubriques trouvées. Créez-en dabord.');
      return;
    }
    
    // 2. Récupérer tous les contenus sans team_ids ou rubrique_id
    const contentsToUpdate = await Content.find({
      $or: [
        { team_ids: { $exists: false } },
        { team_ids: { $size: 0 } },
        { rubrique_id: { $exists: false } },
        { rubrique_id: null }
      ]
    });
    
    console.log(`📋 Contents to update: ${contentsToUpdate.length}`);
    
    if (contentsToUpdate.length === 0) {
      console.log('✅ Tous les contenus sont déjà à jour !');
      return;
    }
    
    // 3. Mettre à jour chaque contenu
    const defaultTeam = teams[0]; // Première équipe par défaut
    const defaultRubrique = rubriques[0]; // Première rubrique par défaut
    
    console.log(`🎯 Using default team: ${defaultTeam.name}`);
    console.log(`🎯 Using default rubrique: ${defaultRubrique.name}`);
    
    for (const content of contentsToUpdate) {
      await Content.findByIdAndUpdate(content._id, {
        team_ids: [defaultTeam._id],
        rubrique_id: defaultRubrique._id
      });
      
      console.log(`✅ Updated: "${content.title}" → team: ${defaultTeam.name}, rubrique: ${defaultRubrique.name}`);
    }
    
    console.log(`🎉 ${contentsToUpdate.length} contenus mis à jour avec succès !`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Lancer la mise à jour
updateContents();
