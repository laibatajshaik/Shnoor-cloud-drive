const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

fileSchema.index({ owner: 1, parentFolder: 1, isDeleted: 1 });
fileSchema.index({ owner: 1, ancestors: 1 });
fileSchema.index({ owner: 1, name: 'text' });

module.exports = mongoose.model('File', fileSchema);
