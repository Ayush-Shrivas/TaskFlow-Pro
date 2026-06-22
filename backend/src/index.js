const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Route files
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: '*', // In development, allow any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow_pro';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB database connection error:', err.message);
    process.exit(1);
  });

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach Socket.io instance to App context so controllers can access it
app.set('io', io);

// Socket connection logic
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Client joins project room
  socket.on('joinProject', (projectId) => {
    socket.join(projectId);
    console.log(`Socket ${socket.id} joined project room: ${projectId}`);
  });

  // Client leaves project room
  socket.on('leaveProject', (projectId) => {
    socket.leave(projectId);
    console.log(`Socket ${socket.id} left project room: ${projectId}`);
  });

  // Client joins private user room for targeted notifications
  socket.on('joinUser', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined private user room: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Base API Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TaskFlow Pro API Server' });
});

// Mounting Router Middleware
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Run server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`TaskFlow Pro server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
