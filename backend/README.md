# SnappClone Backend API

A production-grade backend API for a ride-hailing and delivery service similar to Snapp.

## Features

- User authentication with JWT tokens
- Rider, Driver, and Admin user roles
- Ride booking and management
- Delivery service
- Real-time tracking with Socket.io
- Wallet system with transactions
- Driver assignment algorithm
- Admin dashboard APIs
- Comprehensive error handling and logging

## Tech Stack

- Node.js with TypeScript
- Express.js
- PostgreSQL
- Socket.io for real-time features
- JWT for authentication
- Joi for validation
- Winston for logging

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- Git

## Installation

1. Clone the repository:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the example:
```bash
# Copy this content to .env and update with your values
DB_HOST=localhost
DB_PORT=5432
DB_NAME=snappclone
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
```

4. Create the PostgreSQL database:
```bash
psql -U postgres
CREATE DATABASE snappclone;
\q
```

5. Run database setup:
```bash
npm run db:setup
```

## Running the Application

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/verify-phone` - Verify phone number
- `POST /api/auth/change-password` - Change password

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-avatar` - Upload profile image

### Ride Endpoints

- `POST /api/rides` - Create new ride request
- `GET /api/rides/:id` - Get ride details
- `POST /api/rides/:id/cancel` - Cancel ride
- `GET /api/rides/history` - Get ride history

### Wallet Endpoints

- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/topup` - Top up wallet
- `GET /api/wallet/transactions` - Get transaction history

### Driver Endpoints

- `GET /api/driver/status` - Get driver status
- `PUT /api/driver/availability` - Update availability
- `GET /api/driver/earnings` - Get earnings summary

### Admin Endpoints

- `GET /api/admin/users` - List all users
- `POST /api/admin/vehicles/approve` - Approve vehicle
- `POST /api/admin/refunds` - Process refund

## Socket Events

### Client to Server:
- `location:update` - Update driver location
- `ride:track` - Track ongoing ride
- `delivery:track` - Track ongoing delivery

### Server to Client:
- `driver:location` - Driver location update
- `ride:status` - Ride status update
- `delivery:status` - Delivery status update

## Testing

```bash
npm test
```

## Project Structure

```
backend/
├── src/
│   ├── config/        # Configuration files
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Express middleware
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── socket/        # Socket.io handlers
│   ├── types/         # TypeScript types
│   ├── utils/         # Utility functions
│   └── index.ts       # Entry point
├── logs/              # Log files
├── uploads/           # Uploaded files
└── package.json
```

## Environment Variables

See `.env.example` for all available environment variables.

## License

MIT 