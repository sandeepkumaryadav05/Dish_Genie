require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./db/connectDB');
const recipeRoutes = require('./routes/recipe.route.js');
const preferenceRoutes = require('./routes/preference.route.js');
const userRoutes = require('./routes/user.route.js');
const mealPlanRoutes = require('./routes/mealPlan.route.js');
const recommendationRoutes = require('./routes/recommendation.route.js');
const aiRoutes = require('./routes/ai.route.js');
const adminRoutes = require('./routes/admin.route.js');

const { notFound, errorHandler } = require('./middleware/errorHandler.js');

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

// Trust first proxy (required behind Render / Vercel reverse proxy)
if (isProduction) {
  app.set('trust proxy', 1);
}

// --- CORS ---
const allowOrigins = (process.env.ALLOW_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowOrigins.length ? allowOrigins : false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- Request logging ---
app.use(morgan(isProduction ? 'combined' : 'dev'));

// --- Body parsing ---
app.use(express.json({ limit: '1mb' }));

// --- Security headers (lightweight, no extra dependency) ---
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// --- Health check (used by Render) ---
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/', (_req, res) => res.json({ name: 'DishGenie API', status: 'ok' }));

// --- Routes ---
app.use('/api/recipes', recipeRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// --- Error handling ---
app.use(notFound);
app.use(errorHandler);

// --- Start server ---
let server;

connectDB(process.env.MONGO_URL)
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`DishGenie API running on port ${PORT}`);
      console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

// --- Graceful shutdown ---
function shutdown(signal) {
  console.log(`${signal} received — shutting down gracefully`);
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
  // Force exit after 10 s if connections don't drain
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
