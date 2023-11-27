const mongoose = require('mongoose');

module.exports.connectMongo = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/testdb');
    console.log('Connected to database.');
  } catch (err) {
    console.log(`Failed to connect to DB ${err}`);
  }
};
