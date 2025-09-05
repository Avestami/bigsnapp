import { PaymentStatus, PaymentMethodType, WalletTransactionType } from '@prisma/client';

// Request interfaces
export interface CreatePaymentRequest {
  amount: number;
  method: PaymentMethodType;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TopupWalletRequest {
  amount: number;
  method: PaymentMethodType;
  metadata?: Record<string, any>;
}

export interface PaymentGatewayCallbackRequest {
  reference: string;
  transactionId: string;
  status: string;
  amount: number;
  signature?: string;
  metadata?: Record<string, any>;
}

export interface RefundPaymentRequest {
  amount: number;
  reason: string;
}

// Filter interfaces
export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethodType;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface WalletTransactionFilters {
  type?: WalletTransactionType;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

// Response interfaces
export interface PaymentResponse {
  id: string;
  userId: string;
  amount: number;
  method: PaymentMethodType;
  status: PaymentStatus;
  reference: string;
  description?: string;
  gatewayTransactionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  processedAt?: Date;
}

export interface WalletResponse {
  id: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransactionResponse {
  id: string;
  walletId: string;
  amount: number;
  type: WalletTransactionType;
  description: string;
  reference?: string;
  createdAt: Date;
}

export interface PaymentListResponse {
  payments: PaymentResponse[];
  total: number;
}

export interface WalletTransactionListResponse {
  transactions: WalletTransactionResponse[];
  total: number;
}

export interface PaymentStatisticsResponse {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  paymentMethodBreakdown: {
    method: PaymentMethodType;
    count: number;
    totalAmount: number;
  }[];
  statusBreakdown: {
    status: PaymentStatus;
    count: number;
    totalAmount: number;
  }[];
  timeSeriesData: {
    date: string;
    totalAmount: number;
    transactionCount: number;
  }[];
  topupStats: {
    totalTopups: number;
    totalTopupAmount: number;
    averageTopupAmount: number;
  };
  refundStats: {
    totalRefunds: number;
    totalRefundAmount: number;
    refundRate: number;
  };
}

// Gateway-specific interfaces
export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  links: {
    href: string;
    rel: string;
    method: string;
  }[];
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
}