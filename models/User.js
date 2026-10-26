const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'staff'], required: true },
  // null only for the superadmin, who sits above all restaurants
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null,
    required: function () { return this.role !== 'superadmin'; },
  },
  // Set by the superadmin to block an account (enforcement is not wired up yet)
  locked: { type: Boolean, default: false },
  // Forgot-password flow: only a hash of the emailed token is stored
  resetTokenHash: { type: String, default: null, select: false },
  resetTokenExpires: { type: Date, default: null, select: false },
}, { timestamps: true });

// Only one superadmin may ever exist
userSchema.index({ role: 1 }, { unique: true, partialFilterExpression: { role: 'superadmin' } });
userSchema.index({ restaurantId: 1, role: 1 });

// Assign the plain password to passwordHash; it is hashed on save
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.resetTokenHash;
    delete ret.resetTokenExpires;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
