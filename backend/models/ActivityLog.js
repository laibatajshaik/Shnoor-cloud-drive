const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: {
      type: String,
      enum: [
        'FILE_UPLOAD', 'FILE_RENAME', 'FILE_MOVE', 'FILE_DELETE', 'FILE_DOWNLOAD',
        'FOLDER_CREATE', 'FOLDER_RENAME', 'FOLDER_MOVE', 'FOLDER_DELETE',
        'SHARE_CREATE', 'SHARE_REVOKE', 'SHARE_ACCESS',
      ],
      required: true,
    },
    resourceType: { type: String, enum: ['file', 'folder', 'share'], required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
