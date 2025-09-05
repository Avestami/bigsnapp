import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { DeliveryController } from '../controllers/delivery.controller';
import { authenticateToken, requireAdmin, requireDriver } from '../middlewares/auth';

const router = Router();
const deliveryController = new DeliveryController();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware
const createDeliveryValidation = [
  body('pickupAddress')
    .notEmpty()
    .withMessage('Pickup address is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Pickup address must be between 5 and 500 characters'),
  body('deliveryAddress')
    .notEmpty()
    .withMessage('Delivery address is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Delivery address must be between 5 and 500 characters'),
  body('pickupLatitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid pickup latitude'),
  body('pickupLongitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid pickup longitude'),
  body('deliveryLatitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid delivery latitude'),
  body('deliveryLongitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid delivery longitude'),
  body('recipientName')
    .notEmpty()
    .withMessage('Recipient name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Recipient name must be between 2 and 100 characters'),
  body('recipientPhone')
    .notEmpty()
    .withMessage('Recipient phone is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('packageDescription')
    .notEmpty()
    .withMessage('Package description is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Package description must be between 5 and 500 characters'),
  body('packageWeight')
    .optional()
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Package weight must be between 0.1 and 50 kg'),
  body('packageValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Package value must be a positive number'),
  body('deliveryInstructions')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Delivery instructions must not exceed 500 characters'),
  body('scheduledPickupTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled pickup time format'),
];

const deliveryIdValidation = [
  param('deliveryId')
    .notEmpty()
    .withMessage('Delivery ID is required')
    .isNumeric()
    .withMessage('Delivery ID must be a number'),
];

const locationValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Routes (authentication already applied above)

// Create delivery request
router.post(
  '/',
  // Rate limiting removed - implement if needed
  createDeliveryValidation,
  deliveryController.createDelivery
);

// Get delivery by ID
router.get(
  '/:deliveryId',
  deliveryIdValidation,
  deliveryController.getDeliveryById
);

// Get deliveries with filters
router.get(
  '/',
  paginationValidation,
  [
    query('status')
      .optional()
      .isIn(['PENDING', 'DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'])
      .withMessage('Invalid delivery status'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'scheduledPickupTime', 'estimatedFare'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
  ],
  deliveryController.getDeliveries
);

// Get available deliveries for drivers
router.get(
  '/available/list',
  requireDriver,
  paginationValidation,
  [
    query('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    query('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
    query('radius')
      .optional()
      .isFloat({ min: 1, max: 50 })
      .withMessage('Radius must be between 1 and 50 km'),
  ],
  deliveryController.getAvailableDeliveries
);

// Accept delivery (Driver)
router.patch(
  '/:deliveryId/accept',
  requireDriver,
  deliveryIdValidation,
  deliveryController.acceptDelivery
);

// Mark as picked up (Driver)
router.patch(
  '/:deliveryId/pickup',
  requireDriver,
  deliveryIdValidation,
  deliveryController.markPickedUp
);

// Mark as delivered (Driver)
router.patch(
  '/:deliveryId/deliver',
  requireDriver,
  deliveryIdValidation,
  [
    body('deliveryCode')
      .optional()
      .isLength({ min: 4, max: 10 })
      .withMessage('Delivery code must be between 4 and 10 characters'),
  ],
  deliveryController.markDelivered
);

// Cancel delivery
router.patch(
  '/:deliveryId/cancel',
  deliveryIdValidation,
  [
    body('reason')
      .optional()
      .isLength({ min: 5, max: 500 })
      .withMessage('Cancellation reason must be between 5 and 500 characters'),
  ],
  deliveryController.cancelDelivery
);

// Update delivery location (Driver)
router.patch(
  '/:deliveryId/location',
  requireDriver,
  deliveryIdValidation,
  locationValidation,
  deliveryController.updateLocation
);

// Admin routes
router.use(requireAdmin);

// Assign driver to delivery (Admin only)
router.patch(
  '/:deliveryId/assign',
  deliveryIdValidation,
  [
    body('driverId')
      .notEmpty()
      .withMessage('Driver ID is required')
      .isNumeric()
      .withMessage('Driver ID must be a number'),
  ],
  deliveryController.assignDriver
);

// Get delivery statistics (Admin only)
router.get(
  '/admin/statistics',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
  ],
  deliveryController.getDeliveryStatistics
);

export default router;