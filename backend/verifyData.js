const Team = require('./models/Team');
const TeamMember = require('./models/TeamMember');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/ieg').then(async () => {
  console.log('=== VERIFICATION COMPLETE ===');
  
  const teams = await Team.find({});
  console.log('Teams in database:', teams.length);
  
  for (const team of teams) {
    const memberCount = await TeamMember.countDocuments({ team_id: team._id });
    console.log(`Team: ${team.name} | ID: ${team._id} | Members: ${memberCount}`);
    
    // Vérifier les TeamMember pour cette équipe
    const members = await TeamMember.find({ team_id: team._id });
    members.forEach(m => console.log(`  - Member: ${m.user_id}`));
  }
  
  mongoose.connection.close();
}).catch(console.error);
