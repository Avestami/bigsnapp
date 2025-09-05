export interface CreateDeliveryRequest {
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  recipientName: string;
  recipientPhone: string;
  packageDescription: string;
  packageWeight?: number;
  packageValue?: number;
  deliveryInstructions?: string;
  scheduledPickupTime?: Date;
}

export interface UpdateDeliveryLocationRequest {
  latitude: number;
  longitude: number;
}

export interface UpdateDeliveryLocationData {
  latitude: number;
  longitude: number;
}

export interface DeliveryFilters {
  status?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DeliveryStatisticsFilters {
  startDate?: Date;
  endDate?: Date;
}

export interface CancelDeliveryRequest {
  reason?: string;
}

export interface AssignDriverRequest {
  driverId: number;
}

export interface MarkDeliveredRequest {
  deliveryCode?: string;
}

export interface DeliveryLocationFilters {
  latitude?: number;
  longitude?: number;
  radius: number;
  page: number;
  limit: number;
}

export interface DeliveryResponse {
  id: number;
  userId: number;
  driverId?: number;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  currentLatitude?: number;
  currentLongitude?: number;
  recipientName: string;
  recipientPhone: string;
  packageDescription: string;
  packageWeight?: number;
  packageValue?: number;
  deliveryInstructions?: string;
  scheduledPickupTime?: Date;
  estimatedFare: number;
  finalFare?: number;
  deliveryCode: string;
  status: string;
  createdAt: Date;
  assignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
  driver?: {
    id: number;
    user: {
      firstName: string;
      lastName: string;
      phone: string;
    };
    vehicle: {
      make: string;
      model: string;
      licensePlate: string;
    };
  };
}

export interface DeliveryListResponse {
  deliveries: DeliveryResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeliveryStatistics {
  totalDeliveries: number;
  deliveredCount: number;
  cancelledCount: number;
  pendingCount: number;
  inProgressCount: number;
  deliveryRate: number;
  cancellationRate: number;
}