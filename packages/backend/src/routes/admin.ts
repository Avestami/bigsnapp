import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { prisma } from '../db';
import { UserType } from '@prisma/client';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate, adminOnly);

// Get all users with pagination and filtering
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const userType = req.query.userType as UserType;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (userType) {
      where.userType = userType;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          userType: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get all orders/rides with pagination and filtering
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { pickupAddress: { contains: search, mode: 'insensitive' } },
        { destinationAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        skip,
        take: limit,
        include: {
          rider: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true
            }
          },
          driver: {
            select: {
              id: true,
              licenseNumber: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  phoneNumber: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ride.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Update order status
router.put('/orders/:orderId/status', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await prisma.ride.update({
      where: { id: parseInt(orderId) },
      data: { status },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        },
        driver: {
          select: {
            id: true,
            licenseNumber: true,
            user: {
              select: {
                name: true,
                email: true,
                phoneNumber: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Admin update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Assign driver to order
router.put('/orders/:orderId/assign', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;

    const order = await prisma.ride.update({
      where: { id: parseInt(orderId) },
      data: { 
        driverId: parseInt(driverId),
        status: 'ASSIGNED'
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        },
        driver: {
          select: {
            id: true,
            licenseNumber: true,
            user: {
              select: {
                name: true,
                email: true,
                phoneNumber: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Admin assign driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign driver'
    });
  }
});

// Get analytics data
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [totalUsers, totalOrders, activeDrivers, orderStats, revenueData] = await Promise.all([
      prisma.user.count(),
      prisma.ride.count(Object.keys(dateFilter).length > 0 ? { where: dateFilter } : undefined),
      prisma.user.count({ where: { userType: 'DRIVER' } }),
      prisma.ride.groupBy({
        by: ['status'],
        _count: { status: true },
        ...(dateFilter.createdAt && { where: dateFilter })
      }),
      prisma.ride.aggregate({
        _sum: { fare: true },
        _avg: { fare: true },
        ...(dateFilter.createdAt && { where: dateFilter })
      })
    ]);

    const ordersByStatus = orderStats.reduce((acc, stat) => {
      if (stat._count && typeof stat._count === 'object' && 'status' in stat._count) {
        acc[stat.status] = stat._count.status || 0;
      }
      return acc;
    }, {} as Record<string, number>);

    const analytics = {
      totalUsers,
      totalOrders,
      totalRevenue: revenueData._sum?.fare || 0,
      activeDrivers,
      completedOrders: ordersByStatus.COMPLETED || 0,
      pendingOrders: ordersByStatus.PENDING || 0,
      cancelledOrders: ordersByStatus.CANCELLED || 0,
      averageOrderValue: revenueData._avg?.fare || 0,
      ordersByStatus,
      revenueByMonth: [] // TODO: Implement monthly revenue breakdown
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// Get dashboard stats
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalRides, totalRevenue, activeDrivers] = await Promise.all([
      prisma.user.count(),
      prisma.ride.count(),
      prisma.ride.aggregate({ _sum: { fare: true } }),
      prisma.user.count({ where: { userType: 'DRIVER' } })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRides,
        totalRevenue: totalRevenue._sum.fare || 0,
        activeDrivers
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
});

// Settings endpoints
router.get('/settings', async (req: Request, res: Response) => {
  try {
    // For now, return mock settings since we don't have a settings table
    // TODO: Implement proper settings table and management
    const settings = [
      { id: 1, key: 'maintenanceMode', value: 'false', description: 'Enable maintenance mode', category: 'system', updatedAt: new Date().toISOString() },
      { id: 2, key: 'allowNewRegistrations', value: 'true', description: 'Allow new user registrations', category: 'system', updatedAt: new Date().toISOString() },
      { id: 3, key: 'maxDeliveryRadius', value: '25', description: 'Maximum delivery radius in km', category: 'delivery', updatedAt: new Date().toISOString() },
      { id: 4, key: 'defaultDeliveryFee', value: '3.99', description: 'Default delivery fee', category: 'pricing', updatedAt: new Date().toISOString() }
    ];

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Admin settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

router.put('/settings/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // TODO: Implement proper settings update when settings table is available
    res.json({
      success: true,
      data: {
        id: 1,
        key,
        value,
        description: 'Setting updated',
        category: 'system',
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Admin update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting'
    });
  }
});

// User management endpoints
router.put('/users/:userId/status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { userType, licenseNumber } = req.body;
    const userIdInt = parseInt(userId);

    // Start a transaction for promoting to driver
    const result = await prisma.$transaction(async (tx) => {
      // Update user type
      const user = await tx.user.update({
        where: { id: userIdInt },
        data: { userType },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          userType: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // If promoting to driver, create driver record
      if (userType === 'DRIVER' && licenseNumber) {
        // Check if driver record already exists
        const existingDriver = await tx.driver.findUnique({
          where: { userId: userIdInt }
        });

        if (!existingDriver) {
          await tx.driver.create({
            data: {
              userId: userIdInt,
              licenseNumber,
              isVerified: false
            }
          });
        } else {
          // Update existing driver record
          await tx.driver.update({
            where: { userId: userIdInt },
            data: { licenseNumber }
          });
        }
      }

      return user;
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Admin update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

router.delete('/users/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    // Check if user has active rides before deletion
    const activeRides = await prisma.ride.count({
      where: {
        OR: [
          { userId: userIdInt },
          { driverId: userIdInt }
        ],
        status: {
          in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS']
        }
      }
    });

    if (activeRides > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete user with active rides'
      });
      return;
    }

    // Use transaction to delete user and related records safely
    await prisma.$transaction(async (tx) => {
      // Delete related records that have ON DELETE RESTRICT constraints
      // Delete in reverse dependency order
      
      // Delete admin action logs where user is admin or target
      await tx.adminActionLog.deleteMany({
        where: {
          OR: [
            { adminId: userIdInt },
            { targetUserId: userIdInt }
          ]
        }
      });
      
      // Delete delivery reviews
      await tx.deliveryReview.deleteMany({
        where: {
          OR: [
            { reviewerId: userIdInt },
            { targetDriverId: userIdInt }
          ]
        }
      });
      
      // Delete ride reviews
      await tx.rideReview.deleteMany({
        where: {
          OR: [
            { reviewerId: userIdInt },
            { targetDriverId: userIdInt }
          ]
        }
      });
      
      // Delete payments
      await tx.payment.deleteMany({
        where: { userId: userIdInt }
      });
      
      // Delete delivery requests (sender/receiver)
      await tx.deliveryRequest.deleteMany({
        where: {
          OR: [
            { senderId: userIdInt },
            { receiverId: userIdInt }
          ]
        }
      });
      
      // Delete rides
      await tx.ride.deleteMany({
        where: {
          OR: [
            { userId: userIdInt },
            { driverId: userIdInt }
          ]
        }
      });
      
      // Delete logs
      await tx.log.deleteMany({
        where: { userId: userIdInt }
      });
      
      // Delete favorite locations
      await tx.favoriteLocation.deleteMany({
        where: { userId: userIdInt }
      });
      
      // Delete driver record if exists
      await tx.driver.deleteMany({
        where: { userId: userIdInt }
      });
      
      // Finally delete the user (this will cascade delete user_device, wallet_transaction, topup_request)
      await tx.user.delete({
        where: { id: userIdInt }
      });
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

export default router;