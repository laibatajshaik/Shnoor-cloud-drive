const AppError = require('../utils/AppError');

exports.requireEditPermission = (req, res, next) => {
  if (req.sharePermission && req.sharePermission !== 'edit') {
    return next(new AppError('This is a view-only link. Editing is not permitted.', 403));
  }
  next();
};
