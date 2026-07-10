const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

folderSchema.index({ owner: 1, parentFolder: 1, isDeleted: 1 });
folderSchema.index({ owner: 1, ancestors: 1 });
folderSchema.index(
  { owner: 1, parentFolder: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('Folder', folderSchema);
