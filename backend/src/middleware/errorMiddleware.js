const { HTTP_STATUS } = require("../config/constants");

exports.errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  let error = {
    message: err.message,
    statusCode: err.statusCode,
  };

  if (err.name === "CastError") {
    error.message = "Resource not found";
    error.statusCode = HTTP_STATUS.NOT_FOUND;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} already exists`;
    error.statusCode = HTTP_STATUS.CONFLICT;
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error.message = messages.join(", ");
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
  }

  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token";
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired";
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
  }

  res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

exports.notFound = (req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
