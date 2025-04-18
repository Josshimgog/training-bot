const mongoose = require('mongoose');

module.exports = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) throw new Error('Missing MONGO_URI in environment variables.');

  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Connected to MongoDB');
};