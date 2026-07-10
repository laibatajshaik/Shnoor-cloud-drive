const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const ShareLink = require('../models/ShareLink');
const File = require('../models/File');
const Folder = require('../models/Folder');
const ActivityLog = require('../models/ActivityLog');

exports.createShareLink = catchAsync(async (req, res, next) => {
  const { resourceType, resourceId, permission = 'view', expiresInDays } = req.body;

  if (!['file', 'folder'].includes(resourceType)) return next(new AppError('Invalid resource type', 400));
  if (!['view', 'edit'].includes(permission)) return next(new AppError('Invalid permission level', 400));

  const Model = resourceType === 'file' ? File : Folder;
  const resource = await Model.findOne({ _id: resourceId, owner: req.user._id, isDeleted: false });
  if (!resource) return next(new AppError('Resource not found', 404));

  const shareLink = await ShareLink.create({
    token: ShareLink.generateToken(),
    resourceType,
    resourceId,
    permission,
    createdBy: req.user._id,
    expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null,
  });

  await ActivityLog.create({
    user: req.user._id, action: 'SHARE_CREATE', resourceType: 'share', resourceId: shareLink._id,
    metadata: { resourceType, resourceId, permission },
  });

  res.status(201).json({
    status: 'success',
    data: {
      shareUrl: `${process.env.CLIENT_URL}/share/${shareLink.token}`,
      permission: shareLink.permission,
      expiresAt: shareLink.expiresAt,
    },
  });
});

exports.resolveShareLink = catchAsync(async (req, res, next) => {
  const link = await ShareLink.findOne({ token: req.params.token, isRevoked: false });
  if (!link) return next(new AppError('This link is invalid or has been revoked', 404));
  if (link.expiresAt && link.expiresAt < new Date()) return next(new AppError('This link has expired', 410));

  const Model = link.resourceType === 'file' ? File : Folder;
  const resource = await Model.findOne({ _id: link.resourceId, isDeleted: false });
  if (!resource) return next(new AppError('The shared resource no longer exists', 404));

  link.accessCount += 1;
  await link.save();

  await ActivityLog.create({
    user: req.user?._id || null,
    action: 'SHARE_ACCESS',
    resourceType: 'share',
    resourceId: link._id,
    ip: req.ip,
  });

  res.status(200).json({
    status: 'success',
    data: { resource, resourceType: link.resourceType, permission: link.permission },
  });
});

exports.revokeShareLink = catchAsync(async (req, res, next) => {
  const link = await ShareLink.findOneAndUpdate(
    { token: req.params.token, createdBy: req.user._id },
    { isRevoked: true },
    { new: true }
  );
  if (!link) return next(new AppError('Share link not found', 404));

  await ActivityLog.create({ user: req.user._id, action: 'SHARE_REVOKE', resourceType: 'share', resourceId: link._id });
  res.status(200).json({ status: 'success', message: 'Link revoked' });
});

exports.listMyShareLinks = catchAsync(async (req, res) => {
  const links = await ShareLink.find({ createdBy: req.user._id, isRevoked: false }).sort('-createdAt');
  res.status(200).json({ status: 'success', data: { links } });
});
