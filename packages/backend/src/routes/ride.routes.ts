import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RideController } from '../controllers/ride.controller';
import {
  authenticate,
  adminOnly,
  driverOnly,
  riderOnly,
  driverOrRider,
} from '../middleware/auth.middleware';

const router = Router();
const rideController = new RideController();

// Rate limiting for ride endpoints
const rideRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many ride requests, please try again later',
});

const createRideRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 ride creations per 5 minutes
  message: 'Too many ride creation attempts, please try again later',
});

// Public/General ride routes (require authentication)

/**
 * @route   POST /api/rides
 * @desc    Create a new ride request
 * @access  Rider only
 * @body    { pickupLatitude, pickupLongitude, pickupAddress, destinationLatitude, destinationLongitude, destinationAddress, vehicleType, estimatedDistance?, estimatedDuration?, estimatedFare?, notes? }
 */
router.post('/', authenticate, riderOnly, createRideRateLimit, rideController.createRide);

/**
 * @route   GET /api/rides
 * @desc    Get rides with filters and pagination
 * @access  Private (filtered by user type)
 * @query   { page?, limit?, status?, userId?, driverId?, vehicleType?, startDate?, endDate? }
 */
router.get('/', authenticate, rideRateLimit, rideController.getRides);

/**
 * @route   GET /api/rides/available
 * @desc    Get available rides for drivers
 * @access  Driver only
 * @query   { page?, limit?, vehicleType? }
 */
router.get('/available', authenticate, driverOnly, rideController.getAvailableRides);

/**
 * @route   GET /api/rides/statistics
 * @desc    Get ride statistics
 * @access  Admin only
 * @query   { startDate?, endDate? }
 */
router.get('/statistics', authenticate, adminOnly, rideController.getRideStatistics);

/**
 * @route   GET /api/rides/:rideId
 * @desc    Get ride by ID
 * @access  Private (ride participants or admin)
 * @params  rideId
 */
router.get('/:rideId', authenticate, driverOrRider, rideController.getRideById);

// Driver-specific ride actions

/**
 * @route   PUT /api/rides/:rideId/accept
 * @desc    Driver accepts a ride
 * @access  Driver only
 * @params  rideId
 */
router.put('/:rideId/accept', authenticate, driverOnly, rideController.acceptRide);

/**
 * @route   PUT /api/rides/:rideId/arrive
 * @desc    Driver marks arrival at pickup location
 * @access  Driver only
 * @params  rideId
 */
router.put('/:rideId/arrive', authenticate, driverOnly, rideController.arriveAtPickup);

/**
 * @route   PUT /api/rides/:rideId/start
 * @desc    Start ride (passenger picked up)
 * @access  Driver only
 * @params  rideId
 */
router.put('/:rideId/start', authenticate, driverOnly, rideController.startRide);

/**
 * @route   PUT /api/rides/:rideId/complete
 * @desc    Complete ride
 * @access  Driver only
 * @params  rideId
 * @body    { actualFare?, actualDistance?, actualDuration? }
 */
router.put('/:rideId/complete', authenticate, driverOnly, rideController.completeRide);

/**
 * @route   PUT /api/rides/:rideId/location
 * @desc    Update ride location (for tracking)
 * @access  Driver only
 * @params  rideId
 * @body    { latitude, longitude }
 */
router.put('/:rideId/location', authenticate, driverOnly, rideController.updateLocation);

// General ride actions (rider, driver, or admin)

/**
 * @route   PUT /api/rides/:rideId/cancel
 * @desc    Cancel ride
 * @access  Private (ride participants or admin)
 * @params  rideId
 * @body    { reason? }
 */
router.put('/:rideId/cancel', authenticate, driverOrRider, rideController.cancelRide);

// Admin-only ride actions

/**
 * @route   PUT /api/rides/:rideId/assign
 * @desc    Assign driver to ride (Admin only)
 * @access  Admin only
 * @params  rideId
 * @body    { driverId }
 */
router.put('/:rideId/assign', authenticate, adminOnly, rideController.assignDriver);

export default router;