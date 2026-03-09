const Team = require('./models/Team');
const TeamMember = require('./models/TeamMember');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/les-echos-ieg').then(async () => {
  console.log('=== BASE DE DONNÉES CORRECTE : les-echos-ieg ===');
  
  const teams = await Team.find({});
  console.log('Teams in les-echos-ieg:', teams.length);
  
  for (const team of teams) {
    const memberCount = await TeamMember.countDocuments({ team_id: team._id });
    console.log(`Team: ${team.name} | ID: ${team._id} | Members: ${memberCount}`);
  }
  
  // Vérifier s'il y a des TeamMember
  const teamMembers = await TeamMember.find({});
  console.log(`Total TeamMember records: ${teamMembers.length}`);
  
  mongoose.connection.close();
}).catch(console.error);
