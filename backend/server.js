const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const locationRoutes = require('./routes/location');

// Import Supabase config
const { supabaseAdmin } = require('./config/supabase');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/location', locationRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room for specific order tracking
  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`Client ${socket.id} joined order room: ${orderId}`);
  });

  // Join room for driver location updates
  socket.on('join-driver', (driverId) => {
    socket.join(`driver-${driverId}`);
    console.log(`Client ${socket.id} joined driver room: ${driverId}`);
  });

  // Handle driver location updates
  socket.on('driver-location-update', (data) => {
    socket.to(`driver-${data.driverId}`).emit('driver-location-changed', data);
  });

  // Handle order status updates
  socket.on('order-status-update', (data) => {
    socket.to(`order-${data.orderId}`).emit('order-status-changed', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Supabase Realtime subscriptions
const setupRealtimeSubscriptions = () => {
  // Subscribe to order status changes
  const orderSubscription = supabaseAdmin
    .channel('order-status-changes')
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('Order status changed:', payload);
        io.to(`order-${payload.new.id}`).emit('order-status-changed', {
          orderId: payload.new.id,
          status: payload.new.status,
          updatedAt: payload.new.updated_at
        });
      }
    )
    .subscribe();

  // Subscribe to driver location updates
  const locationSubscription = supabaseAdmin
    .channel('driver-location-updates')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'driver_locations' },
      (payload) => {
        console.log('Driver location updated:', payload);
        io.to(`driver-${payload.new.driver_id}`).emit('driver-location-changed', {
          driverId: payload.new.driver_id,
          lat: payload.new.lat,
          lng: payload.new.lng,
          timestamp: payload.new.timestamp
        });
      }
    )
    .subscribe();

  // Subscribe to order tracking updates
  const trackingSubscription = supabaseAdmin
    .channel('order-tracking-updates')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'order_tracking' },
      (payload) => {
        console.log('Order tracking updated:', payload);
        io.to(`order-${payload.new.order_id}`).emit('order-tracking-updated', {
          orderId: payload.new.order_id,
          status: payload.new.status,
          description: payload.new.description,
          timestamp: payload.new.created_at
        });
      }
    )
    .subscribe();

  return { orderSubscription, locationSubscription, trackingSubscription };
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  
  // Setup realtime subscriptions
  const subscriptions = setupRealtimeSubscriptions();
  console.log(`🔔 Realtime subscriptions active`);
  
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 