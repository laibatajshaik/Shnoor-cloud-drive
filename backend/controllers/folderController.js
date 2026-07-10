const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Folder = require('../models/Folder');
const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const folderService = require('../services/folderService');

exports.listChildren = catchAsync(async (req, res) => {
  const parentFolder = req.query.parentFolder || null;
  const { cursor, limit = 50 } = req.query;

  const folderQuery = { owner: req.user._id, parentFolder, isDeleted: false };
  const fileQuery = { owner: req.user._id, parentFolder, isDeleted: false };
  if (cursor) {
    folderQuery._id = { $gt: cursor };
    fileQuery._id = { $gt: cursor };
  }

  const [folders, files] = await Promise.all([
    Folder.find(folderQuery).sort({ name: 1 }).limit(Number(limit)),
    File.find(fileQuery).sort({ name: 1 }).limit(Number(limit)),
  ]);

  res.status(200).json({ status: 'success', data: { folders, files } });
});

exports.createFolder = catchAsync(async (req, res, next) => {
  const { name, parentFolder } = req.body;
  if (!name?.trim()) return next(new AppError('Folder name is required', 400));

  const folder = await folderService.createFolder({
    name: name.trim(),
    parentFolderId: parentFolder,
    ownerId: req.user._id,
  });

  await ActivityLog.create({
    user: req.user._id,
    action: 'FOLDER_CREATE',
    resourceType: 'folder',
    resourceId: folder._id,
  });

  req.io.to(`folder:${parentFolder || 'root'}`).emit('folderCreated', { folder });

  res.status(201).json({ status: 'success', data: { folder } });
});

exports.renameFolder = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name?.trim()) return next(new AppError('New name is required', 400));

  const folder = await folderService.renameFolder({
    folderId: req.params.id,
    newName: name.trim(),
    ownerId: req.user._id,
  });

  await ActivityLog.create({
    user: req.user._id, action: 'FOLDER_RENAME', resourceType: 'folder', resourceId: folder._id,
  });

  req.io.to(`folder:${folder.parentFolder || 'root'}`).emit('folderRenamed', { folder });
  res.status(200).json({ status: 'success', data: { folder } });
});

exports.moveFolder = catchAsync(async (req, res, next) => {
  const { newParentId } = req.body;
  const oldFolder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
  const oldParentId = oldFolder?.parentFolder;

  const folder = await folderService.moveFolder({
    folderId: req.params.id,
    newParentId: newParentId || null,
    ownerId: req.user._id,
  });

  await ActivityLog.create({
    user: req.user._id,
    action: 'FOLDER_MOVE',
    resourceType: 'folder',
    resourceId: folder._id,
    metadata: { from: oldParentId, to: newParentId },
  });

  req.io.to(`folder:${oldParentId || 'root'}`).emit('folderRemoved', { folderId: folder._id });
  req.io.to(`folder:${newParentId || 'root'}`).emit('folderAdded', { folder });

  res.status(200).json({ status: 'success', data: { folder } });
});

exports.deleteFolder = catchAsync(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
  const result = await folderService.deleteFolder({ folderId: req.params.id, ownerId: req.user._id });

  await ActivityLog.create({
    user: req.user._id, action: 'FOLDER_DELETE', resourceType: 'folder', resourceId: req.params.id,
  });

  req.io.to(`folder:${folder.parentFolder || 'root'}`).emit('folderRemoved', { folderId: folder._id });
  res.status(200).json({ status: 'success', data: result });
});

exports.searchFiles = catchAsync(async (req, res, next) => {
  const { q } = req.query;
  if (!q?.trim()) return next(new AppError('Search query is required', 400));

  const files = await File.find(
    { owner: req.user._id, isDeleted: false, $text: { $search: q } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(50);

  res.status(200).json({ status: 'success', results: files.length, data: { files } });
});
