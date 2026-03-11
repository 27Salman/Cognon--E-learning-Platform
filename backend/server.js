require("dotenv").config();

const express = require("express");
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const connectDB = require("./src/config/db");
const {HTTP_STATUS} = require('./src/config/constants');
const { authRoutes } = require('./src/routes');
const { errorHandler, notFound } = require('./src/middleware/errorMiddleware');
require('./src/controllers/googleAuthController'); // Initialize passport strategies
const PORT = process.env.PORT || 5000;

const app = express();
connectDB();

app.use(helmet());

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

if( process.env.NODE_ENV === 'development'){
  app.use(morgan('dev'));
}

app.use('/uploads', express.static('uploads'));

// check routes
app.get('/api/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);


app.listen(PORT, ()=>{
  console.log(`Server is running at ${PORT}`);
})

//Server Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
