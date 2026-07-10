const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { streamUpload, destroyAsset } = require('../services/cloudinaryUpload');
const { findOrCreateFolderPath } = require('../services/folderService');

exports.uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file provided', 400));

  const { parentFolder } = req.body;

  const user = await User.findById(req.user._id);
  if (user.storageUsedBytes + req.file.size > user.storageQuotaBytes) {
    return next(new AppError('Storage quota exceeded. Delete some files or upgrade your plan.', 413));
  }

  let ancestors = [];
  if (parentFolder) {
    const parent = await Folder.findOne({ _id: parentFolder, owner: req.user._id, isDeleted: false });
    if (!parent) return next(new AppError('Destination folder not found', 404));
    ancestors = [...parent.ancestors, parent._id];
  }

  let cloudinaryResult;
  try {
    cloudinaryResult = await streamUpload(req.file.buffer, `drive/${req.user._id}`);

    const file = await File.create({
      name: req.file.originalname,
      originalName: req.file.originalname,
      url: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      mimeType: req.file.mimetype,
      size: cloudinaryResult.bytes,
      owner: req.user._id,
      parentFolder: parentFolder || null,
      ancestors,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsedBytes: file.size } });
    await ActivityLog.create({
      user: req.user._id, action: 'FILE_UPLOAD', resourceType: 'file', resourceId: file._id,
    });

    req.io.to(`folder:${parentFolder || 'root'}`).emit('fileAdded', { file });

    res.status(201).json({ status: 'success', data: { file } });
  } catch (err) {
  console.error("UPLOAD ERROR:", err);

  failed.push({
    name: file.originalname,
    reason: err.message || "Upload failed",
  });
}
});

exports.renameFile = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name?.trim()) return next(new AppError('New name is required', 400));

  const file = await File.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id, isDeleted: false },
    { name: name.trim() },
    { new: true, runValidators: true }
  );
  if (!file) return next(new AppError('File not found', 404));

  await ActivityLog.create({ user: req.user._id, action: 'FILE_RENAME', resourceType: 'file', resourceId: file._id });
  req.io.to(`folder:${file.parentFolder || 'root'}`).emit('fileRenamed', { file });

  res.status(200).json({ status: 'success', data: { file } });
});

exports.moveFile = catchAsync(async (req, res, next) => {
  const { newParentId } = req.body;
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false });
  if (!file) return next(new AppError('File not found', 404));

  const oldParentId = file.parentFolder;
  let newAncestors = [];
  if (newParentId) {
    const newParent = await Folder.findOne({ _id: newParentId, owner: req.user._id, isDeleted: false });
    if (!newParent) return next(new AppError('Destination folder not found', 404));
    newAncestors = [...newParent.ancestors, newParent._id];
  }

  file.parentFolder = newParentId || null;
  file.ancestors = newAncestors;
  await file.save();

  await ActivityLog.create({
    user: req.user._id, action: 'FILE_MOVE', resourceType: 'file', resourceId: file._id,
    metadata: { from: oldParentId, to: newParentId },
  });

  req.io.to(`folder:${oldParentId || 'root'}`).emit('fileRemoved', { fileId: file._id });
  req.io.to(`folder:${newParentId || 'root'}`).emit('fileAdded', { file });

  res.status(200).json({ status: 'success', data: { file } });
});

exports.deleteFile = catchAsync(async (req, res, next) => {
  const file = await File.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!file) return next(new AppError('File not found', 404));

  await ActivityLog.create({ user: req.user._id, action: 'FILE_DELETE', resourceType: 'file', resourceId: file._id });
  req.io.to(`folder:${file.parentFolder || 'root'}`).emit('fileRemoved', { fileId: file._id });

  res.status(200).json({ status: 'success', data: null });
});

exports.uploadBatch = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next(new AppError('No files provided', 400));

  const { parentFolder } = req.body;
  let relativePaths = [];
  try {
    relativePaths = req.body.relativePaths ? JSON.parse(req.body.relativePaths) : [];
  } catch {
    return next(new AppError('Malformed relativePaths payload', 400));
  }

  const user = await User.findById(req.user._id);
  const totalSize = req.files.reduce((sum, f) => sum + f.size, 0);
  if (user.storageUsedBytes + totalSize > user.storageQuotaBytes) {
    return next(new AppError('Storage quota exceeded. Delete some files or upgrade your plan.', 413));
  }

  const folderCache = new Map();
  const uploaded = [];
  const failed = [];

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const relPath = relativePaths[i] || '';
    const segments = relPath.split('/').filter(Boolean);
    segments.pop();

    let targetFolderId = parentFolder || null;
    let targetAncestors = [];

    try {
      if (segments.length > 0) {
        const cacheKey = segments.join('/');
        if (folderCache.has(cacheKey)) {
          ({ finalFolderId: targetFolderId, finalAncestors: targetAncestors } = folderCache.get(cacheKey));
        } else {
          const result = await findOrCreateFolderPath({
            segments,
            rootParentId: parentFolder || null,
            ownerId: req.user._id,
          });
          targetFolderId = result.finalFolderId;
          targetAncestors = result.finalAncestors;
          folderCache.set(cacheKey, result);
        }
      } else if (parentFolder) {
        const parent = await Folder.findOne({ _id: parentFolder, owner: req.user._id, isDeleted: false });
        if (!parent) throw new AppError('Destination folder not found', 404);
        targetAncestors = [...parent.ancestors, parent._id];
      }

      const cloudinaryResult = await streamUpload(file.buffer, `drive/${req.user._id}`);

      const savedFile = await File.create({
        name: file.originalname,
        originalName: file.originalname,
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        mimeType: file.mimetype,
        size: cloudinaryResult.bytes,
        owner: req.user._id,
        parentFolder: targetFolderId,
        ancestors: targetAncestors,
      });

      await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsedBytes: savedFile.size } });
      req.io.to(`folder:${targetFolderId || 'root'}`).emit('fileAdded', { file: savedFile });
      uploaded.push(savedFile);
    } catch (err) {
      failed.push({ name: file.originalname, reason: err.message || 'Upload failed' });
    }
  }

  if (uploaded.length > 0) {
    await ActivityLog.create({
      user: req.user._id,
      action: 'FILE_UPLOAD',
      resourceType: 'file',
      resourceId: uploaded[0]._id,
      metadata: { batchSize: uploaded.length, failedCount: failed.length },
    });
  }

  res.status(uploaded.length > 0 ? 201 : 400).json({
    status: uploaded.length > 0 ? 'success' : 'fail',
    data: { uploaded, failed },
  });
});

exports.getDownloadUrl = catchAsync(async (req, res, next) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false });
  if (!file) return next(new AppError('File not found', 404));

  await ActivityLog.create({ user: req.user._id, action: 'FILE_DOWNLOAD', resourceType: 'file', resourceId: file._id });

  const downloadUrl = file.url.replace('/upload/', '/upload/fl_attachment/');
  res.status(200).json({ status: 'success', data: { url: downloadUrl } });
});
