import { AdminActionLog, Prisma } from '@prisma/client';
import { prisma } from '../index';
import { BaseRepository, PaginationOptions, PaginatedResult, createPaginatedResult } from './base.repository';

export interface CreateAdminActionLogInput {
  adminId: number;
  actionType: string;
  targetUserId?: number;
  targetVehicleId?: number;
  details?: string;
}

export interface AdminActionLogWithRelations extends AdminActionLog {
  admin?: any;
  targetUser?: any;
  targetVehicle?: any;
}

export interface AdminActionLogFilters {
  adminId?: number;
  actionType?: string;
  targetUserId?: number;
  targetVehicleId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export class AdminLogRepository {
  async findById(id: number): Promise<AdminActionLog | null> {
    return prisma.adminActionLog.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        targetVehicle: {
          select: {
            id: true,
            licensePlate: true,
            model: true,
          },
        },
      },
    });
  }

  async findMany(options?: PaginationOptions & AdminActionLogFilters): Promise<AdminActionLog[]> {
    const {
      page = 1,
      limit = 10,
      orderBy,
      adminId,
      actionType,
      targetUserId,
      targetVehicleId,
      dateFrom,
      dateTo,
    } = options || {};
    const skip = (page - 1) * limit;

    const where: Prisma.AdminActionLogWhereInput = {};
    
    if (adminId) where.adminId = adminId;
    if (actionType) where.actionType = { contains: actionType, mode: 'insensitive' };
    if (targetUserId) where.targetUserId = targetUserId;
    if (targetVehicleId) where.targetVehicleId = targetVehicleId;
    
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = dateFrom;
      if (dateTo) where.timestamp.lte = dateTo;
    }

    return prisma.adminActionLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderBy || { timestamp: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        targetVehicle: {
          select: {
            id: true,
            licensePlate: true,
            model: true,
          },
        },
      },
    });
  }

  async findManyPaginated(options?: PaginationOptions & AdminActionLogFilters): Promise<PaginatedResult<AdminActionLog>> {
    const { page = 1, limit = 10 } = options || {};

    const [data, total] = await Promise.all([
      this.findMany(options),
      this.count(options),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async create(data: CreateAdminActionLogInput): Promise<AdminActionLog> {
    return prisma.adminActionLog.create({
      data,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        targetVehicle: {
          select: {
            id: true,
            licensePlate: true,
            model: true,
          },
        },
      },
    });
  }

  async count(filters?: AdminActionLogFilters): Promise<number> {
    const {
      adminId,
      actionType,
      targetUserId,
      targetVehicleId,
      dateFrom,
      dateTo,
    } = filters || {};

    const where: Prisma.AdminActionLogWhereInput = {};
    
    if (adminId) where.adminId = adminId;
    if (actionType) where.actionType = { contains: actionType, mode: 'insensitive' };
    if (targetUserId) where.targetUserId = targetUserId;
    if (targetVehicleId) where.targetVehicleId = targetVehicleId;
    
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = dateFrom;
      if (dateTo) where.timestamp.lte = dateTo;
    }

    return prisma.adminActionLog.count({ where });
  }

  // Specific action logging methods
  async logUserAction(
    adminId: number,
    action: 'suspend' | 'unsuspend' | 'delete' | 'update' | 'create',
    targetUserId: number,
    details?: string
  ): Promise<AdminActionLog> {
    return this.create({
      adminId,
      actionType: `user_${action}`,
      targetUserId,
      details,
    });
  }

  async logDriverAction(
    adminId: number,
    action: 'approve' | 'reject' | 'suspend' | 'verify' | 'unverify',
    targetDriverId: number,
    details?: string
  ): Promise<AdminActionLog> {
    return this.create({
      adminId,
      actionType: `driver_${action}`,
      targetUserId: targetDriverId,
      details,
    });
  }

  async logVehicleAction(
    adminId: number,
    action: 'approve' | 'reject' | 'suspend' | 'verify' | 'unverify',
    targetVehicleId: number,
    details?: string
  ): Promise<AdminActionLog> {
    return this.create({
      adminId,
      actionType: `vehicle_${action}`,
      targetVehicleId,
      details,
    });
  }

  async logPaymentAction(
    adminId: number,
    action: 'refund' | 'approve_topup' | 'reject_topup' | 'cancel',
    targetUserId: number,
    details?: string
  ): Promise<AdminActionLog> {
    return this.create({
      adminId,
      actionType: `payment_${action}`,
      targetUserId,
      details,
    });
  }

  async logWalletAction(
    adminId: number,
    action: 'adjust_balance' | 'freeze' | 'unfreeze' | 'approve_topup' | 'reject_topup',
    targetUserId: number,
    details?: string
  ): Promise<AdminActionLog> {
    return this.create({
      adminId,
      actionType: `wallet_${action}`,
      targetUserId,
      details,
    });
  }

  async logRideAction(
    adminId: number,
    action: 'cancel' | 'refund' | 'investigate' | 'resolve_dispute',
    targetUserId: number,
    details?: string
  ): Promise<AdminActionLog> {
    return this.create({
      adminId,
      actionType: `ride_${action}`,
      targetUserId,
      details,
    });
  }

  async logDeliveryAction(
    adminId: number,
    action: 'cancel' | 'refund' | 'investigate' | 'resolve_dispute',
    targetUserId: number,
    details?: string
  ): Promise<AdminActionLog> {
    return this.create({
      adminId,
      actionType: `delivery_${action}`,
      targetUserId,
      details,
    });
  }

  async logSystemAction(
    adminId: number,
    action: string,
    details?: string
  ): Promise<AdminActionLog> {
    return this.create({
      adminId,
      actionType: `system_${action}`,
      details,
    });
  }

  // Query methods
  async findByAdminUser(adminId: number, options?: PaginationOptions): Promise<AdminActionLog[]> {
    return this.findMany({ ...options, adminId });
  }

  async findByAction(actionType: string, options?: PaginationOptions): Promise<AdminActionLog[]> {
    return this.findMany({ ...options, actionType });
  }

  async findByTargetUser(targetUserId: number, options?: PaginationOptions): Promise<AdminActionLog[]> {
    return this.findMany({ ...options, targetUserId });
  }

  async findByTargetVehicle(targetVehicleId: number, options?: PaginationOptions): Promise<AdminActionLog[]> {
    return this.findMany({ ...options, targetVehicleId });
  }

  async findByDateRange(dateFrom: Date, dateTo: Date, options?: PaginationOptions): Promise<AdminActionLog[]> {
    return this.findMany({ ...options, dateFrom, dateTo });
  }

  // Statistics methods
  async getActionStats(dateFrom?: Date, dateTo?: Date): Promise<Record<string, number>> {
    const where: Prisma.AdminActionLogWhereInput = {};
    
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = dateFrom;
      if (dateTo) where.timestamp.lte = dateTo;
    }

    const stats = await prisma.adminActionLog.groupBy({
      by: ['actionType'],
      _count: {
        id: true,
      },
      where,
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return stats.reduce((acc, stat) => {
      acc[stat.actionType] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);
  }

  async getAdminStats(dateFrom?: Date, dateTo?: Date): Promise<Array<{
    adminId: number;
    admin: any;
    actionCount: number;
  }>> {
    const where: Prisma.AdminActionLogWhereInput = {};
    
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = dateFrom;
      if (dateTo) where.timestamp.lte = dateTo;
    }

    const stats = await prisma.adminActionLog.groupBy({
      by: ['adminId'],
      _count: {
        id: true,
      },
      where,
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Fetch admin user details
    const adminUserIds = stats.map(stat => stat.adminId);
    const adminUsers = await prisma.user.findMany({
      where: {
        id: {
          in: adminUserIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
      },
    });

    return stats.map(stat => {
      const admin = adminUsers.find(user => user.id === stat.adminId);
      return {
        adminId: stat.adminId,
        admin,
        actionCount: stat._count.id,
      };
    });
  }

  async getTargetStats(dateFrom?: Date, dateTo?: Date): Promise<{
    userTargets: number;
    vehicleTargets: number;
  }> {
    const where: Prisma.AdminActionLogWhereInput = {};
    
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = dateFrom;
      if (dateTo) where.timestamp.lte = dateTo;
    }

    const userTargets = await prisma.adminActionLog.count({
      where: {
        ...where,
        targetUserId: { not: null },
      },
    });

    const vehicleTargets = await prisma.adminActionLog.count({
      where: {
        ...where,
        targetVehicleId: { not: null },
      },
    });

    return {
      userTargets,
      vehicleTargets,
    };
  }

  // Recent activity
  async getRecentActivity(limit: number = 20): Promise<AdminActionLog[]> {
    return this.findMany({
      limit,
      orderBy: { timestamp: 'desc' },
    });
  }

  async getRecentActivityByAdmin(adminId: number, limit: number = 20): Promise<AdminActionLog[]> {
    return this.findMany({
      adminId,
      limit,
      orderBy: { timestamp: 'desc' },
    });
  }

  // Audit trail for specific entities
  async getUserAuditTrail(targetUserId: number): Promise<AdminActionLog[]> {
    return this.findMany({
      targetUserId,
      orderBy: { timestamp: 'desc' },
    });
  }

  async getVehicleAuditTrail(targetVehicleId: number): Promise<AdminActionLog[]> {
    return this.findMany({
      targetVehicleId,
      orderBy: { timestamp: 'desc' },
    });
  }

  // Security monitoring
  async findSuspiciousActivity(options?: {
    multipleActionsThreshold?: number;
    timeWindowMinutes?: number;
  }): Promise<Array<{
    adminId: number;
    admin: any;
    actionCount: number;
    actions: string[];
    timeWindow: { start: Date; end: Date };
  }>> {
    const {
      multipleActionsThreshold = 10,
      timeWindowMinutes = 60,
    } = options || {};

    const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    const where: Prisma.AdminActionLogWhereInput = {
      timestamp: {
        gte: timeWindow,
      },
    };

    const recentLogs = await prisma.adminActionLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Group by admin user and count actions
    const adminActivity = recentLogs.reduce((acc, log) => {
      const key = log.adminId;
      if (!acc[key]) {
        acc[key] = {
          adminId: log.adminId,
          admin: log.admin,
          actions: [],
          logs: [],
        };
      }
      acc[key].actions.push(log.actionType);
      acc[key].logs.push(log);
      return acc;
    }, {} as Record<number, any>);

    // Filter admins with suspicious activity
    return Object.values(adminActivity)
      .filter((activity: any) => activity.actions.length >= multipleActionsThreshold)
      .map((activity: any) => ({
        adminId: activity.adminId,
        admin: activity.admin,
        actionCount: activity.actions.length,
        actions: Array.from(new Set(activity.actions)), // Unique actions
        timeWindow: {
          start: timeWindow,
          end: new Date(),
        },
      }));
  }
}