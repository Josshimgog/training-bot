const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  plannedTime: String, // or use Date if you prefer
  sessionType: String,
  sessionStatus: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);