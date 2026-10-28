import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sanitizePayload } from './middleware/sanitize.js';
import { apiGeneralLimiter } from './middleware/rateLimit.js';

export function createApp() {
  const app = express();

  // 1. Enterprise Security Headers via Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // 2. Strict CORS Configuration
  const allowedOrigins: string[] = Array.isArray(ENV.CLIENT_ORIGIN)
    ? ENV.CLIENT_ORIGIN
    : ['http://localhost:8081', 'http://localhost:5173', 'http://localhost:3000'];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Mobile applications (React Native / Expo) send undefined or null origin
        if (!origin || allowedOrigins.includes(origin) || ENV.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('CORS policy: Access denied'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    })
  );

  // 3. HTTP Request Logging
  app.use(morgan(ENV.NODE_ENV === 'development' ? 'dev' : 'combined'));

  // 4. Rate Limiting on API Surface
  app.use('/api/', apiGeneralLimiter);

  // 5. Body Parsing with Safe Size Limits (1MB)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 6. Deep Input Sanitization against XSS & Prototype Pollution
  app.use(sanitizePayload);

  // Root route
  app.get('/', (req, res) => {
    res.json({
      name: 'Thaluwa Bazar API',
      name_as: 'থলুৱা বজাৰ এপিআই',
      version: '1.0.0',
      docs: '/api/v1/health',
    });
  });

  // API Router
  app.use('/api/v1', apiRouter);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
