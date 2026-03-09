const Team = require('./models/Team');
const TeamMember = require('./models/TeamMember');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/ieg').then(async () => {
  console.log('=== TOUTES LES ÉQUIPES ===');
  
  const teams = await Team.find({});
  console.log('Total teams found:', teams.length);
  
  teams.forEach((team, index) => {
    console.log(`${index + 1}. Team: ${team.name}`);
    console.log(`   ID: ${team._id}`);
    console.log(`   Description: ${team.description}`);
    console.log(`   Created: ${team.created_at}`);
    console.log('');
  });
  
  mongoose.connection.close();
}).catch(console.error);
