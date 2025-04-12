const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  data: {
    Investments: { type: Object, default: {} },
    RealEstate: { type: Object, default: {} },
    Others: { type: Object, default: {} }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
