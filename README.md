# 🚚 Delivery Tracking System

A comprehensive real-time delivery tracking system built with React Native, Node.js, and Supabase. Features include live driver location tracking, order status updates, JWT authentication, and a beautiful UI inspired by food delivery apps.

## ✨ Features

### 🎯 Core Features
- **Real-time Driver Tracking**: Live location updates using Google Maps and Supabase Realtime
- **Order Status Management**: Complete order lifecycle from pending to delivered
- **JWT Authentication**: Secure login for customers and delivery agents
- **Driver Assignment**: Automatic assignment of nearest available driver
- **Real-time Updates**: Socket.IO and Supabase Realtime for instant updates
- **Beautiful UI**: Warm color scheme (#FFF3DC, #482E1D) inspired by Swiggy/Zomato

### 📱 Frontend (React Native)
- **Delivery Tracking Screen**: Real-time map with moving driver marker
- **Status Timeline**: Visual order progress with dynamic updates
- **Order Details**: Complete order information with customer/driver details
- **Bottom Navigation**: Home, Orders, and Profile tabs
- **Driver Dashboard**: Order management for delivery agents
- **Authentication**: Login/Register with role-based access

### 🔧 Backend (Node.js + Express)
- **Secure APIs**: JWT authentication with role-based middleware
- **Order Management**: CRUD operations for orders with status updates
- **Driver Assignment**: Haversine formula for nearest driver calculation
- **Location Tracking**: Real-time driver location updates
- **Socket.IO Integration**: Real-time communication
- **Rate Limiting**: API protection with express-rate-limit

### 🗄️ Database (Supabase)
- **PostgreSQL Schema**: Optimized tables with proper relationships
- **Row Level Security**: Secure data access policies
- **Real-time Subscriptions**: Live updates for orders and locations
- **Geospatial Functions**: Distance calculation and nearest driver queries
- **Triggers**: Automatic timestamp updates and status tracking

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Node.js API   │    │    Supabase     │
│   Frontend      │◄──►│   Backend       │◄──►│   PostgreSQL    │
│                 │    │                 │    │                 │
│ • Maps          │    │ • JWT Auth      │    │ • Real-time     │
│ • Socket.IO     │    │ • Order Mgmt    │    │ • RLS Policies  │
│ • Status UI     │    │ • Location API  │    │ • Geospatial    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Expo CLI
- Supabase account
- Google Maps API key

### 1. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase_schema.sql`
3. Enable Row Level Security and Realtime for tables
4. Note your Supabase URL and keys

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Start the server:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Update `app.json` with your configuration:
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseAnonKey": "your_supabase_anon_key",
      "apiUrl": "http://localhost:3001/api"
    }
  }
}
```

Start the app:
```bash
npm start
```

## 📊 Database Schema

### Tables
- **users**: Customer and driver accounts
- **drivers**: Driver-specific information
- **orders**: Order details and status
- **driver_locations**: Real-time location tracking
- **order_tracking**: Status history and updates
- **restaurants**: Restaurant information

### Key Functions
- `calculate_distance()`: Haversine formula for distance calculation
- `find_nearest_driver()`: Find closest available driver
- `update_order_status()`: Update order and add tracking entry

## 🔐 Authentication

### JWT Implementation
- Secure token storage using expo-secure-store
- Role-based authentication (customer/driver/admin)
- Automatic token refresh and verification
- Protected API endpoints with middleware

### API Endpoints
```
POST /api/auth/customer/login
POST /api/auth/driver/login
POST /api/auth/register
GET  /api/auth/verify
```

## 🗺️ Real-time Tracking

### Features
- Live driver location updates every 10 seconds
- Real-time order status changes
- Socket.IO rooms for order-specific updates
- Supabase Realtime subscriptions
- Google Maps integration with route display

### Implementation
```javascript
// Driver location update
await apiService.updateLocation({
  lat: coords.latitude,
  lng: coords.longitude,
  accuracy: coords.accuracy,
  speed: coords.speed,
  heading: coords.heading,
});

// Real-time subscription
socket.emit('join-order', orderId);
socket.on('order-status-changed', handleStatusUpdate);
```

## 🎨 UI/UX Design

### Color Scheme
- **Primary Background**: #FFF3DC (Warm cream)
- **Text**: #482E1D (Dark brown)
- **Accent**: #FF9800 (Orange)
- **Success**: #4CAF50 (Green)
- **Error**: #F44336 (Red)

### Components
- **StatusTimeline**: Visual order progress
- **MapView**: Google Maps with custom markers
- **BottomTabNavigator**: Navigation with warm colors
- **LinearGradient**: Beautiful gradient backgrounds

## 📱 Screens

### Customer Screens
1. **LoginScreen**: JWT authentication with role selection
2. **HomeScreen**: Dashboard with recent orders and quick actions
3. **OrdersScreen**: List of all customer orders
4. **DeliveryTrackingScreen**: Real-time map tracking
5. **OrderDetailsScreen**: Complete order information

### Driver Screens
1. **DriverDashboardScreen**: Assigned orders and status updates
2. **Location tracking**: Automatic GPS updates
3. **Order management**: Status update buttons

## 🔧 API Endpoints

### Orders
```
GET    /api/orders/customer     # Customer orders
GET    /api/orders/driver       # Driver orders
GET    /api/orders/:id          # Order details
POST   /api/orders              # Create order
PATCH  /api/orders/:id/status   # Update status
POST   /api/orders/:id/assign-driver # Assign driver
```

### Location
```
POST   /api/location/update     # Update driver location
GET    /api/location/driver/:id # Get driver location
GET    /api/location/active-drivers # All active drivers
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Customer/Driver/Admin middleware
- **Rate Limiting**: API protection
- **Input Validation**: Joi schema validation
- **Row Level Security**: Database-level security
- **Helmet**: Security headers
- **CORS**: Cross-origin protection

## 🚀 Deployment

### Backend Deployment
```bash
# Production build
npm run build
npm start
```

### Frontend Deployment
```bash
# Expo build
expo build:android
expo build:ios
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your_production_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Frontend (app.json)
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "your_supabase_url",
      "supabaseAnonKey": "your_supabase_anon_key",
      "apiUrl": "your_api_url"
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🔮 Future Enhancements

- Push notifications
- Payment integration
- Restaurant management
- Analytics dashboard
- Multi-language support
- Offline mode
- Voice commands
- AR delivery tracking

---

**Built with ❤️ using React Native, Node.js, and Supabase** 