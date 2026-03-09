const mongoose = require('mongoose');
const Team = require('./models/Team');

mongoose.connect('mongodb://localhost:27017/ieg').then(async () => {
  const teams = await Team.find({});
  console.log('All teams:');
  teams.forEach(t => {
    console.log(`- ${t.name}: members=${t.members.length}`);
  });
  mongoose.connection.close();
}).catch(console.error);
