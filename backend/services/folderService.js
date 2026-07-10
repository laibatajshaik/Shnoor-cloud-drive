const mongoose = require('mongoose');
const Folder = require('../models/Folder');
const File = require('../models/File');
const AppError = require('../utils/AppError');

async function createFolder({ name, parentFolderId, ownerId }) {
  let ancestors = [];
  if (parentFolderId) {
    const parent = await Folder.findOne({ _id: parentFolderId, owner: ownerId, isDeleted: false });
    if (!parent) throw new AppError('Parent folder not found', 404);
    ancestors = [...parent.ancestors, parent._id];
  }

  return Folder.create({ name, owner: ownerId, parentFolder: parentFolderId || null, ancestors });
}

async function moveFolder({ folderId, newParentId, ownerId }) {
  if (String(folderId) === String(newParentId)) {
    throw new AppError('Cannot move a folder into itself', 400);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const folder = await Folder.findOne({ _id: folderId, owner: ownerId, isDeleted: false }).session(session);
    if (!folder) throw new AppError('Folder not found', 404);

    let newAncestors = [];
    if (newParentId) {
      const newParent = await Folder.findOne({ _id: newParentId, owner: ownerId, isDeleted: false }).session(session);
      if (!newParent) throw new AppError('Destination folder not found', 404);

      const isDescendant = newParent.ancestors.some((a) => a.equals(folder._id));
      if (isDescendant) throw new AppError('Cannot move a folder into its own subfolder', 400);

      newAncestors = [...newParent.ancestors, newParent._id];
    }

    const oldFolderId = folder._id;
    folder.parentFolder = newParentId || null;
    folder.ancestors = newAncestors;
    await folder.save({ session });

    const descendantFolders = await Folder.find({ owner: ownerId, ancestors: oldFolderId }).session(session);
    for (const desc of descendantFolders) {
      const idx = desc.ancestors.findIndex((a) => a.equals(oldFolderId));
      desc.ancestors = [...newAncestors, oldFolderId, ...desc.ancestors.slice(idx + 1)];
      await desc.save({ session });
    }

    const descendantFiles = await File.find({ owner: ownerId, ancestors: oldFolderId }).session(session);
    for (const file of descendantFiles) {
      const idx = file.ancestors.findIndex((a) => a.equals(oldFolderId));
      file.ancestors = [...newAncestors, oldFolderId, ...file.ancestors.slice(idx + 1)];
      await file.save({ session });
    }

    await session.commitTransaction();
    return folder;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function deleteFolder({ folderId, ownerId }) {
  const folder = await Folder.findOne({ _id: folderId, owner: ownerId, isDeleted: false });
  if (!folder) throw new AppError('Folder not found', 404);

  const descendantFolders = await Folder.find({ owner: ownerId, ancestors: folder._id });
  const allFolderIds = [folder._id, ...descendantFolders.map((f) => f._id)];

  const now = new Date();
  await Folder.updateMany({ _id: { $in: allFolderIds } }, { isDeleted: true, deletedAt: now });
  await File.updateMany(
    { owner: ownerId, $or: [{ parentFolder: { $in: allFolderIds } }, { ancestors: { $in: allFolderIds } }] },
    { isDeleted: true, deletedAt: now }
  );

  return { deletedFolderIds: allFolderIds };
}

async function renameFolder({ folderId, newName, ownerId }) {
  const folder = await Folder.findOneAndUpdate(
    { _id: folderId, owner: ownerId, isDeleted: false },
    { name: newName },
    { new: true, runValidators: true }
  );
  if (!folder) throw new AppError('Folder not found', 404);
  return folder;
}

async function findOrCreateFolderPath({ segments, rootParentId, ownerId }) {
  let currentParentId = rootParentId || null;
  let currentAncestors = [];

  if (rootParentId) {
    const rootParent = await Folder.findOne({ _id: rootParentId, owner: ownerId, isDeleted: false });
    if (!rootParent) throw new AppError('Destination folder not found', 404);
    currentAncestors = [...rootParent.ancestors, rootParent._id];
  }

  for (const rawName of segments) {
    const name = rawName.trim();
    if (!name) continue;

    let folder = await Folder.findOne({
      owner: ownerId,
      parentFolder: currentParentId,
      name,
      isDeleted: false,
    });

    if (!folder) {
      folder = await Folder.create({
        name,
        owner: ownerId,
        parentFolder: currentParentId,
        ancestors: currentAncestors,
      });
    }

    currentParentId = folder._id;
    currentAncestors = [...currentAncestors, folder._id];
  }

  return { finalFolderId: currentParentId, finalAncestors: currentAncestors };
}

module.exports = { createFolder, moveFolder, deleteFolder, renameFolder, findOrCreateFolderPath };
