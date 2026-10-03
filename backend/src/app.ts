import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Security & logging middleware
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(morgan(ENV.NODE_ENV === 'development' ? 'dev' : 'combined'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
