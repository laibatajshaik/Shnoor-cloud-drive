const mongoose = require('mongoose');
const crypto = require('crypto');

const shareLinkSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    resourceType: { type: String, enum: ['file', 'folder'], required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    permission: { type: String, enum: ['view', 'edit'], default: 'view' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, default: null },
    isRevoked: { type: Boolean, default: false },
    accessCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

shareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

shareLinkSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('ShareLink', shareLinkSchema);
