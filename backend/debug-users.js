const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb+srv://fouedkacem:B3rli2@cluster0.mongodb.net/les-echos-ieg?retryWrites=true&w=majority')
  .then(async () => {
    console.log('=== CONNECTÉ À MONGODB ===');
    
    // 1. Vérifier tous les utilisateurs
    const allUsers = await User.find({});
    console.log('=== TOUS LES UTILISATEURS ===');
    console.log('Nombre total:', allUsers.length);
    allUsers.forEach((user, index) => {
      console.log(`Utilisateur ${index + 1}:`);
      console.log('  _id:', user._id);
      console.log('  name:', user.name);
      console.log('  email:', user.email);
      console.log('  firstName:', user.firstName);
      console.log('  lastName:', user.lastName);
      console.log('  fullName:', user.fullName);
      console.log('  username:', user.username);
      console.log('---');
    });
    
    // 2. Test de recherche
    console.log('\n=== TEST RECHERCHE AVEC "syl" ===');
    const searchResults = await User.find({
      $or: [
        { name: { $regex: 'syl', $options: 'i' } },
        { email: { $regex: 'syl', $options: 'i' } },
        { firstName: { $regex: 'syl', $options: 'i' } },
        { lastName: { $regex: 'syl', $options: 'i' } },
        { username: { $regex: 'syl', $options: 'i' } }
      ]
    });
    
    console.log('Résultats de recherche:', searchResults.length);
    searchResults.forEach((user, index) => {
      console.log(`Résultat ${index + 1}:`);
      console.log('  _id:', user._id);
      console.log('  name:', user.name);
      console.log('  email:', user.email);
      console.log('---');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur de connexion:', err);
    process.exit(1);
  });
