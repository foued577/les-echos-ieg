const mongoose = require('mongoose');
const Team = require('./models/Team');

mongoose.connect('mongodb://localhost:27017/ieg').then(async () => {
  const teams = await Team.find({});
  console.log('Teams with IDs:');
  teams.forEach(t => {
    console.log(`ID: ${t._id}, Name: ${t.name}, Members: ${t.members?.length || 0}`);
  });
  mongoose.connection.close();
}).catch(console.error);
