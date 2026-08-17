function notFound(req, res, next) {
  res.status(404).json({ message: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Server error';

  // Mongoose: invalid ObjectId (e.g. bad recipe id in URL)
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path || 'id'}: "${err.value}"`;
  }

  // Mongoose: schema validation failure
  if (err.name === 'ValidationError') {
    status = 400;
    const fields = Object.keys(err.errors || {}).map(
      (k) => err.errors[k].message
    );
    message = fields.length ? fields.join('; ') : 'Validation failed';
  }

  // Mongo: duplicate key
  if (err.code === 11000) {
    status = 409;
    message = 'Duplicate value not allowed';
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    message,
    // Only expose stack traces in development to avoid leaking internals.
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = { notFound, errorHandler };
