import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Route imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import eventRoutes from './routes/event.routes.js';
import listingRoutes from './routes/listing.routes.js';
import serviceRoutes from './routes/service.routes.js';
import pollRoutes from './routes/poll.routes.js';
import chatRoutes from './routes/chat.routes.js';
import groupChatRoutes from './routes/groupChat.routes.js';
import notificationRoutes from './routes/notification.routes.js';

// Socket setup import
import { initSocket } from './socket.js';

const app = express();
const port = process.env.PORT || 8084;

// CORS configuration with dynamic origin check
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', process.env.CLIENT_URL].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server) or allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoDB connection
const dbURL = process.env.dbURL || 'mongodb://127.0.0.1:27017/localloop';
mongoose
  .connect(dbURL)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/group-chat', groupChatRoutes);
app.use('/api/notifications', notificationRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Create HTTP Server & Initialize Socket.IO
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

initSocket(io);

// Start server
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`LocalLoop server is running on http://0.0.0.0:${port}`);
});

export { app, httpServer, io };
