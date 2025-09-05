import { RideReview, DeliveryReview, Prisma } from '@prisma/client';
import { prisma } from '../index';
import { BaseRepository, PaginationOptions, PaginatedResult, createPaginatedResult } from './base.repository';

export interface CreateRideReviewInput {
  rideId: number;
  reviewerId: number;
  targetDriverId: number;
  rating: number;
  comment?: string;
}

export interface UpdateRideReviewInput {
  rating?: number;
  comment?: string;
}

export interface CreateDeliveryReviewInput {
  deliveryId: number;
  reviewerId: number;
  targetDriverId: number;
  rating: number;
  comment?: string;
}

export interface UpdateDeliveryReviewInput {
  rating?: number;
  comment?: string;
}

export interface RideReviewWithRelations extends RideReview {
  ride?: any;
  reviewer?: any;
  targetDriver?: any;
}

export interface DeliveryReviewWithRelations extends DeliveryReview {
  delivery?: any;
  reviewer?: any;
  targetDriver?: any;
}

export class ReviewRepository {
  // Ride Review methods
  async findRideReviewById(id: number): Promise<RideReview | null> {
    return prisma.rideReview.findUnique({
      where: { id },
      include: {
        ride: {
          select: {
            id: true,
            userId: true,
            driverId: true,
            status: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        targetDriver: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });
  }

  async findRideReviews(options?: PaginationOptions & { rideId?: number; reviewerId?: number; targetDriverId?: number }): Promise<RideReview[]> {
    const { page = 1, limit = 10, orderBy, rideId, reviewerId, targetDriverId } = options || {};
    const skip = (page - 1) * limit;

    const where: Prisma.RideReviewWhereInput = {};
    if (rideId) where.rideId = rideId;
    if (reviewerId) where.reviewerId = reviewerId;
    if (targetDriverId) where.targetDriverId = targetDriverId;

    return prisma.rideReview.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        ride: {
          select: {
            id: true,
            userId: true,
            driverId: true,
            status: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        targetDriver: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });
  }

  async findRideReviewsPaginated(options?: PaginationOptions & { rideId?: number; reviewerId?: number; targetDriverId?: number }): Promise<PaginatedResult<RideReview>> {
    const { page = 1, limit = 10, rideId, reviewerId, targetDriverId } = options || {};

    const [data, total] = await Promise.all([
      this.findRideReviews(options),
      this.countRideReviews({ rideId, reviewerId, targetDriverId }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async createRideReview(data: CreateRideReviewInput): Promise<RideReview> {
    // Validate rating range
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return prisma.rideReview.create({
      data,
      include: {
        ride: {
          select: {
            id: true,
            userId: true,
            driverId: true,
            status: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        targetDriver: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });
  }

  async updateRideReview(id: number, data: UpdateRideReviewInput): Promise<RideReview> {
    // Validate rating range if provided
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    return prisma.rideReview.update({
      where: { id },
      data,
      include: {
        ride: {
          select: {
            id: true,
            userId: true,
            driverId: true,
            status: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        targetDriver: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });
  }

  async deleteRideReview(id: number): Promise<void> {
    await prisma.rideReview.delete({
      where: { id },
    });
  }

  async countRideReviews(options?: { rideId?: number; reviewerId?: number; targetDriverId?: number }): Promise<number> {
    const where: Prisma.RideReviewWhereInput = {};
    if (options?.rideId) where.rideId = options.rideId;
    if (options?.reviewerId) where.reviewerId = options.reviewerId;
    if (options?.targetDriverId) where.targetDriverId = options.targetDriverId;

    return prisma.rideReview.count({ where });
  }

  // Delivery Review methods
  async findDeliveryReviewById(id: number): Promise<DeliveryReview | null> {
    return prisma.deliveryReview.findUnique({
      where: { id },
      include: {
        delivery: {
          select: {
            id: true,
            senderId: true,
            status: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        targetDriver: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });
  }

  async findDeliveryReviews(options?: PaginationOptions & { deliveryId?: number; reviewerId?: number; targetDriverId?: number }): Promise<DeliveryReview[]> {
    const { page = 1, limit = 10, orderBy, deliveryId, reviewerId, targetDriverId } = options || {};
    const skip = (page - 1) * limit;

    const where: Prisma.DeliveryReviewWhereInput = {};
    if (deliveryId) where.deliveryId = deliveryId;
    if (reviewerId) where.reviewerId = reviewerId;
    if (targetDriverId) where.targetDriverId = targetDriverId;

    return prisma.deliveryReview.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        delivery: {
          select: {
            id: true,
            senderId: true,
            status: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        targetDriver: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });
  }

  async findDeliveryReviewsPaginated(options?: PaginationOptions & { deliveryId?: number; reviewerId?: number; targetDriverId?: number }): Promise<PaginatedResult<DeliveryReview>> {
    const { page = 1, limit = 10, deliveryId, reviewerId, targetDriverId } = options || {};

    const [data, total] = await Promise.all([
      this.findDeliveryReviews(options),
      this.countDeliveryReviews({ deliveryId, reviewerId, targetDriverId }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async createDeliveryReview(data: CreateDeliveryReviewInput): Promise<DeliveryReview> {
    // Validate rating range
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return prisma.deliveryReview.create({
      data,
      include: {
        delivery: {
          select: {
            id: true,
            senderId: true,
            status: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        targetDriver: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });
  }

  async updateDeliveryReview(id: number, data: UpdateDeliveryReviewInput): Promise<DeliveryReview> {
    // Validate rating range if provided
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    return prisma.deliveryReview.update({
      where: { id },
      data,
      include: {
        delivery: {
          select: {
            id: true,
            senderId: true,
            status: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        targetDriver: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });
  }

  async deleteDeliveryReview(id: number): Promise<void> {
    await prisma.deliveryReview.delete({
      where: { id },
    });
  }

  async countDeliveryReviews(options?: { deliveryId?: number; reviewerId?: number; targetDriverId?: number }): Promise<number> {
    const where: Prisma.DeliveryReviewWhereInput = {};
    if (options?.deliveryId) where.deliveryId = options.deliveryId;
    if (options?.reviewerId) where.reviewerId = options.reviewerId;
    if (options?.targetDriverId) where.targetDriverId = options.targetDriverId;

    return prisma.deliveryReview.count({ where });
  }

  // Combined query methods
  async findReviewsByRideId(rideId: number): Promise<RideReview[]> {
    return this.findRideReviews({ rideId });
  }

  async findReviewsByDeliveryId(deliveryId: number): Promise<DeliveryReview[]> {
    return this.findDeliveryReviews({ deliveryId });
  }

  async findReviewsGivenByUser(userId: number, options?: PaginationOptions): Promise<{
    rideReviews: RideReview[];
    deliveryReviews: DeliveryReview[];
  }> {
    const [rideReviews, deliveryReviews] = await Promise.all([
      this.findRideReviews({ ...options, reviewerId: userId }),
      this.findDeliveryReviews({ ...options, reviewerId: userId }),
    ]);

    return { rideReviews, deliveryReviews };
  }

  async findReviewsReceivedByUser(userId: number, options?: PaginationOptions): Promise<{
    rideReviews: RideReview[];
    deliveryReviews: DeliveryReview[];
  }> {
    const [rideReviews, deliveryReviews] = await Promise.all([
      this.findRideReviews({ ...options, targetDriverId: userId }),
      this.findDeliveryReviews({ ...options, targetDriverId: userId }),
    ]);

    return { rideReviews, deliveryReviews };
  }

  // Statistics methods
  async getUserRatingStats(userId: number): Promise<{
    rideStats: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Record<number, number>;
    };
    deliveryStats: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Record<number, number>;
    };
  }> {
    const [rideReviews, deliveryReviews] = await Promise.all([
      prisma.rideReview.findMany({
        where: { targetDriverId: userId },
        select: { rating: true },
      }),
      prisma.deliveryReview.findMany({
        where: { targetDriverId: userId },
        select: { rating: true },
      }),
    ]);

    const calculateStats = (reviews: { rating: number }[]) => {
      if (reviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      return {
        averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
        totalReviews: reviews.length,
        ratingDistribution,
      };
    };

    return {
      rideStats: calculateStats(rideReviews),
      deliveryStats: calculateStats(deliveryReviews),
    };
  }

  async getDriverRatingStats(driverId: number): Promise<{
    rideStats: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Record<number, number>;
    };
    deliveryStats: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Record<number, number>;
    };
  }> {
    // Get the user ID for the driver
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { userId: true },
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    return this.getUserRatingStats(driver.userId);
  }

  // Check if review exists
  async rideReviewExists(rideId: number, reviewerId: number): Promise<boolean> {
    const count = await prisma.rideReview.count({
      where: {
        rideId,
        reviewerId,
      },
    });
    return count > 0;
  }

  async deliveryReviewExists(deliveryId: number, reviewerId: number): Promise<boolean> {
    const count = await prisma.deliveryReview.count({
      where: {
        deliveryId,
        reviewerId,
      },
    });
    return count > 0;
  }

  // Get recent reviews
  async getRecentRideReviews(limit: number = 10): Promise<RideReview[]> {
    return this.findRideReviews({ limit, orderBy: { createdAt: 'desc' } });
  }

  async getRecentDeliveryReviews(limit: number = 10): Promise<DeliveryReview[]> {
    return this.findDeliveryReviews({ limit, orderBy: { createdAt: 'desc' } });
  }

  // Get top-rated users/drivers
  async getTopRatedUsers(limit: number = 10): Promise<Array<{
    userId: number;
    user: any;
    averageRating: number;
    totalReviews: number;
  }>> {
    // This is a complex query that might need raw SQL or multiple queries
    // For now, we'll implement a simplified version
    const rideReviews = await prisma.rideReview.groupBy({
      by: ['targetDriverId'],
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: 5, // At least 5 reviews
          },
        },
      },
      orderBy: {
        _avg: {
          rating: 'desc',
        },
      },
      take: limit,
    });

    // Fetch user details
    const userIds = rideReviews.map(review => review.targetDriverId);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });

    return rideReviews.map(review => {
      const user = users.find(u => u.id === review.targetDriverId);
      return {
        userId: review.targetDriverId,
        user,
        averageRating: review._avg.rating || 0,
        totalReviews: review._count.id,
      };
    });
  }
}