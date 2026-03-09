const Team = require('./models/Team');
const TeamMember = require('./models/TeamMember');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/ieg').then(async () => {
  console.log('=== DIAGNOSTIC TEAM DATA ===');
  
  const teams = await Team.find({});
  console.log('Teams in database:', teams.length);
  
  for (const team of teams) {
    const memberCount = await TeamMember.countDocuments({ team_id: team._id });
    console.log(`Team: ${team.name} | ID: ${team._id} | Members: ${memberCount}`);
  }
  
  mongoose.connection.close();
}).catch(console.error);
