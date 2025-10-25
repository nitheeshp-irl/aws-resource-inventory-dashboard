import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './models';
import { AccountController } from './controllers/AccountController';
import { ResourceController } from './controllers/ResourceController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date(),
      version: '1.0.0',
    },
    timestamp: new Date(),
  });
});

// Account routes
app.get('/api/accounts', AccountController.getAccounts);
app.get('/api/accounts/:id', AccountController.getAccount);
app.post('/api/accounts', AccountController.createAccount);
app.put('/api/accounts/:id', AccountController.updateAccount);
app.delete('/api/accounts/:id', AccountController.deleteAccount);
app.post('/api/accounts/:id/test', AccountController.testConnection);

// Resource routes
app.get('/api/resources', ResourceController.getResources);
app.get('/api/resources/summary', ResourceController.getResourceSummary);
app.get('/api/resources/account/:accountId', ResourceController.getAccountResources);
app.post('/api/resources/refresh', ResourceController.refreshAllResources);
app.post('/api/resources/refresh/:accountId', ResourceController.refreshAccountResources);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date(),
    },
    timestamp: new Date(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      timestamp: new Date(),
    },
    timestamp: new Date(),
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('Failed to initialize database. Exiting...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
