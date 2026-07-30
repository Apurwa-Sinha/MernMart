const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// error tracking — only activates if SENTRY_DSN is set, so local/dev
// environments without a DSN configured just skip it silently rather
// than crashing on startup
const Sentry = require('@sentry/node');
const sentryEnabled = !!process.env.SENTRY_DSN;
if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

// import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const productRoutes = require('./routes/product');
const braintreeRoutes = require('./routes/braintree');
const orderRoutes = require('./routes/order');
const groupOrderRoutes = require('./routes/groupOrder');
const stylistRoutes = require('./routes/stylist');

// app
const app = express();

// Sentry request tracing must be the first middleware, before routes
if (sentryEnabled) {
  app.use(Sentry.Handlers.requestHandler());
}

// NOTE: update these to your actual production domain(s) before deploying —
// these are placeholders and requests from any other origin will be blocked.
const ALLOWED_ORIGINS = [
  'https://vantagecart.onrender.com',
  'https://vantagecart-server.onrender.com',
];

// db connection — only auto-connects outside of tests, since test files
// manage their own in-memory MongoDB connection lifecycle
if (process.env.NODE_ENV !== 'test') {
  const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB Connected');
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  };
  connectDB();
}

// security headers
app.use(helmet());

// general rate limit across the whole API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// tighter limit on auth endpoints — vulnerable to credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/signin', authLimiter);
app.use('/api/signup', authLimiter);

// tighter limit on the AI endpoints — these cost real money per call
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests to this feature. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/stylist', aiLimiter);
app.use('/api/products/visual-search', aiLimiter);

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
  })
);

// routes middleware
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', productRoutes);
app.use('/api', braintreeRoutes);
app.use('/api', orderRoutes);
app.use('/api', groupOrderRoutes);
app.use('/api', stylistRoutes);

// Sentry error handler must come after routes, before any custom error
// handling middleware, so it can capture anything that bubbles up
if (sentryEnabled) {
  app.use(Sentry.Handlers.errorHandler());
}

// Server static assets if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

module.exports = app;
