const mongoose = require('mongoose');
const Team = require('./models/Team');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/ieg').then(async () => {
  console.log('🔍=== CHECKING USER IDs ===');
  
  // Récupérer tous les utilisateurs
  const users = await User.find({});
  console.log('👥 Users in DB:');
  users.forEach(u => {
    console.log(`- ${u._id} : ${u.email}`);
  });
  
  console.log('\n🔍=== CHECKING TEAM MEMBERS ===');
  
  // Récupérer l'équipe aa
  const team = await Team.findById('699ed01843bbc4f628348c86');
  console.log('Team aa members:', team.members);
  console.log('Team aa membersCount:', team.members.length);
  
  // Vérifier chaque ID de membre
  for (const memberId of team.members) {
    const user = await User.findById(memberId);
    console.log(`Member ID ${memberId}:`, user ? `✅ ${user.email}` : '❌ NOT FOUND');
  }
  
  // Si le premier utilisateur n'existe pas, l'ajouter
  if (users.length > 0 && team.members.length === 0) {
    const firstUser = users[0];
    console.log(`\n🔧 Adding ${firstUser.email} to team aa...`);
    team.members.push(firstUser._id);
    await team.save();
    console.log('✅ Team aa updated');
  }
  
  mongoose.connection.close();
}).catch(console.error);
