require("dotenv").config({ path: __dirname + '/.env' });

const path = require('path');
const express = require("express");
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const connectDB = require("./src/config/db");
const { HTTP_STATUS } = require('./src/config/constants');
const { errorHandler, notFound } = require('./src/middleware/errorMiddleware');

require('./src/controllers/googleAuthController'); 

const { authRoutes } = require('./src/routes/authRoutes');
const { adminRoutes } = require('./src/routes/adminRoutes');
const { tutorRoutes } = require('./src/routes/tutorRoutes');
const { userRoutes, publicCatalogRoutes } = require('./src/routes/userRoutes');
const { courseRoutes } = require('./src/routes/courseRoutes');
const { lessonRoutes } = require('./src/routes/lessonRoutes');
const { chatRoutes } = require('./src/routes/chatRoutes');
const { progressRoutes } = require('./src/routes/progressRoutes');
const { categoryRoutes } = require('./src/routes/categoryRoutes');
const { couponRoutes } = require('./src/routes/couponRoutes');
const { offerRoutes } = require('./src/routes/offerRoutes');
const checkoutController = require('./src/controllers/checkoutController');

const PORT = process.env.PORT || 5000;

const app = express();
connectDB();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.post('/api/webhook/razorpay', express.raw({ type: 'application/json' }), checkoutController.handleWebhook);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/uploads', (req, res, next) => {
    if (req.path.startsWith('/pdfs/')) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
}, express.static(path.join(__dirname, 'src/uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/student', userRoutes);

app.use('/api/catalog', publicCatalogRoutes);

app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/courses', progressRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/offers', offerRoutes);


app.get('/api/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
