module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.error('ERROR 💥:', err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      status: 'fail',
      message: 'A resource with that name already exists here.',
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong on our end.',
  });
};
