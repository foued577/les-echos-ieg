const mongoose = require('mongoose');
const User = require('./models/User');
const Team = require('./models/Team');

mongoose.connect('mongodb://localhost:27017/ieg').then(async () => {
  const users = await User.find({});
  console.log('Users in DB:');
  users.forEach(u => {
    console.log(`- ${u._id} : ${u.email}`);
  });
  
  const team = await Team.findById('699ed01843bbc4f628348c86');
  console.log('Team member IDs:');
  team.members.forEach(m => {
    console.log(`- ${m}`);
  });
  
  mongoose.connection.close();
}).catch(console.error);
