// testMongo.js
const mongoose = require('mongoose');
const User = require('./backend/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    await User.deleteOne({ username: 'admin' });
    console.log('✅ Usuario admin eliminado');
    mongoose.disconnect();
  })
  .catch(console.error);
