import { UserType, VehicleType, RideStatus, DeliveryStatus, PaymentStatus, PaymentMethodType } from '@prisma/client';

// User fixtures
export const userFixtures = {
  regularUser: {
    email: 'user@test.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    userType: UserType.USER,
    isVerified: true,
  },
  
  driver: {
    email: 'driver@test.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Driver',
    phoneNumber: '+1234567891',
    userType: UserType.DRIVER,
    isVerified: true,
    licenseNumber: 'DL123456789',
    licenseExpiryDate: new Date('2025-12-31'),
    isAvailable: true,
    currentLatitude: 37.7749,
    currentLongitude: -122.4194,
  },
  
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    phoneNumber: '+1234567892',
    userType: UserType.ADMIN,
    isVerified: true,
  },
};

// Vehicle fixtures
export const vehicleFixtures = {
  sedan: {
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    color: 'Black',
    licensePlate: 'ABC123',
    vehicleType: VehicleType.SEDAN,
    isVerified: true,
  },
  
  suv: {
    make: 'Honda',
    model: 'CR-V',
    year: 2023,
    color: 'White',
    licensePlate: 'XYZ789',
    vehicleType: VehicleType.SUV,
    isVerified: true,
  },
};

// Location fixtures
export const locationFixtures = {
  sanFrancisco: {
    latitude: 37.7749,
    longitude: -122.4194,
    address: '123 Market St, San Francisco, CA 94102',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
  },
  
  oakland: {
    latitude: 37.8044,
    longitude: -122.2712,
    address: '456 Broadway, Oakland, CA 94607',
    city: 'Oakland',
    state: 'CA',
    zipCode: '94607',
  },
};

// Ride fixtures
export const rideFixtures = {
  pendingRide: {
    pickupLatitude: 37.7749,
    pickupLongitude: -122.4194,
    pickupAddress: '123 Market St, San Francisco, CA',
    destinationLatitude: 37.8044,
    destinationLongitude: -122.2712,
    destinationAddress: '456 Broadway, Oakland, CA',
    vehicleType: VehicleType.SEDAN,
    estimatedDistance: 12.5,
    estimatedDuration: 25,
    estimatedFare: 18.75,
    status: RideStatus.PENDING,
  },
  
  acceptedRide: {
    pickupLatitude: 37.7749,
    pickupLongitude: -122.4194,
    pickupAddress: '123 Market St, San Francisco, CA',
    destinationLatitude: 37.8044,
    destinationLongitude: -122.2712,
    destinationAddress: '456 Broadway, Oakland, CA',
    vehicleType: VehicleType.SEDAN,
    estimatedDistance: 12.5,
    estimatedDuration: 25,
    estimatedFare: 18.75,
    status: RideStatus.ACCEPTED,
    acceptedAt: new Date(),
  },
};

// Delivery fixtures
export const deliveryFixtures = {
  pendingDelivery: {
    pickupLatitude: 37.7749,
    pickupLongitude: -122.4194,
    pickupAddress: '123 Restaurant St, San Francisco, CA',
    deliveryLatitude: 37.7849,
    deliveryLongitude: -122.4094,
    deliveryAddress: '789 Customer Ave, San Francisco, CA',
    packageDescription: 'Food delivery - 2 meals',
    packageWeight: 1.5,
    estimatedDistance: 3.2,
    estimatedFare: 8.50,
    status: DeliveryStatus.PENDING,
  },
  
  acceptedDelivery: {
    pickupLatitude: 37.7749,
    pickupLongitude: -122.4194,
    pickupAddress: '123 Restaurant St, San Francisco, CA',
    deliveryLatitude: 37.7849,
    deliveryLongitude: -122.4094,
    deliveryAddress: '789 Customer Ave, San Francisco, CA',
    packageDescription: 'Food delivery - 2 meals',
    packageWeight: 1.5,
    estimatedDistance: 3.2,
    estimatedFare: 8.50,
    status: DeliveryStatus.ACCEPTED,
    acceptedAt: new Date(),
  },
};

// Payment fixtures
export const paymentFixtures = {
  pendingPayment: {
    amount: 18.75,
    paymentMethod: PaymentMethodType.CREDIT_CARD,
    status: PaymentStatus.PENDING,
    transactionId: 'txn_test_123456',
  },
  
  completedPayment: {
    amount: 18.75,
    paymentMethod: PaymentMethodType.CREDIT_CARD,
    status: PaymentStatus.COMPLETED,
    transactionId: 'txn_test_123456',
    processedAt: new Date(),
  },
};

// Wallet fixtures
export const walletFixtures = {
  userWallet: {
    balance: 100.00,
    currency: 'IRR',
  },
  
  driverWallet: {
    balance: 250.50,
    currency: 'IRR',
  },
};

// Review fixtures
export const reviewFixtures = {
  rideReview: {
    rating: 5,
    comment: 'Excellent ride, very professional driver!',
  },
  
  deliveryReview: {
    rating: 4,
    comment: 'Fast delivery, food was still warm.',
  },
};

// Socket event fixtures
export const socketEventFixtures = {
  rideRequest: {
    event: 'ride:request',
    data: {
      rideId: 1,
      userId: 1,
      pickup: locationFixtures.sanFrancisco,
      destination: locationFixtures.oakland,
      vehicleType: VehicleType.SEDAN,
    },
  },
  
  rideAccepted: {
    event: 'ride:accepted',
    data: {
      rideId: 1,
      driverId: 2,
      estimatedArrival: 5,
    },
  },
  
  locationUpdate: {
    event: 'location:update',
    data: {
      userId: 2,
      latitude: 37.7749,
      longitude: -122.4194,
      heading: 45,
    },
  },
};

// Error fixtures
export const errorFixtures = {
  validationError: {
    message: 'Validation failed',
    errors: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'password', message: 'Password must be at least 8 characters' },
    ],
  },
  
  authError: {
    message: 'Authentication failed',
    code: 'AUTH_FAILED',
  },
  
  notFoundError: {
    message: 'Resource not found',
    code: 'NOT_FOUND',
  },
};