// 📁 backend/models/User.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  publicId: {
    type: String,
    unique: true,
    index: true,
    default: () => crypto.randomUUID()
  },
  receiveWeeklyEmail: {
    type: Boolean,
    default: false
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    index: true,
    set: v => v.toLowerCase()
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'readonly'],
    default: 'user'
  },
    blocked: {
      type: Boolean,
      default: false
  },
  approved: {
    type: Boolean,
    default: true // Auto-aprobado ahora
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

// Additional compound index (future queries): approved + role for admin dashboards
try {
  userSchema.index({ role: 1, approved: 1 });
} catch {}

module.exports = mongoose.model('User', userSchema);
