// ===========================================
// SmartProperty - Payment Entity
// ===========================================

import { ObjectId } from 'mongodb';
import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PaymentType {
  RENT = 'rent',
  DEPOSIT = 'deposit',
  UTILITY = 'utility',
  LATE_FEE = 'late_fee',
  MAINTENANCE = 'maintenance',
  COMMISSION = 'commission',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  DIGITAL_WALLET = 'digital_wallet',
  BNPL = 'buy_now_pay_later',
  OTHER = 'other',
}

// Improvements:
// 1. Idempotency key to prevent duplicate charges
// 2. Stripe integration IDs for tracking
// 3. Soft delete support (deletedAt)
// 4. Comprehensive audit trail
// 5. Retry mechanism for failed payments

@Entity('payments')
export class Payment {
  @ObjectIdColumn()
  _id?: ObjectId;

  @Column()
  id?: string;

  // ─────────────────────────────────────────────────────────
  // Relationship Fields
  // ─────────────────────────────────────────────────────────

  @Column()
  leaseId: ObjectId | string;

  @Column()
  tenantId: ObjectId | string;

  @Column()
  ownerId: ObjectId | string;

  @Column()
  agencyId?: ObjectId | string;

  // ─────────────────────────────────────────────────────────
  // Payment Details
  // ─────────────────────────────────────────────────────────

  @Column()
  amount: number; // In cents to avoid float precision

  @Column()
  currency: string; // Default: USD

  @Column()
  type: PaymentType;

  @Column()
  status: PaymentStatus;

  @Column()
  method: PaymentMethod;

  @Column()
  description?: string;

  @Column()
  invoiceId?: string;

  // ─────────────────────────────────────────────────────────
  // Stripe Integration
  // ─────────────────────────────────────────────────────────

  @Column()
  stripePaymentIntentId?: string; // Payment Intent ID

  @Column()
  stripeCustomerId?: string; // Stripe Customer ID

  @Column()
  transactionId?: string; // Charge ID or transaction reference

  @Column()
  gatewayRefId?: string; // For reconciliation

  @Column()
  gatewayResponse?: Record<string, any>; // Store raw response

  // ─────────────────────────────────────────────────────────
  // Idempotency & Deduplication (IMPROVEMENT #1)
  // ─────────────────────────────────────────────────────────

  @Column()
  idempotencyKey?: string; // Prevent duplicate charges

  // ─────────────────────────────────────────────────────────
  // Timestamps & Due Dates
  // ─────────────────────────────────────────────────────────

  @Column()
  dueDate: Date;

  @Column()
  paidAt?: Date;

  @Column()
  scheduledFor?: Date; // For scheduled/recurring payments

  // ─────────────────────────────────────────────────────────
  // Financial Breakdown
  // ─────────────────────────────────────────────────────────

  @Column()
  fee?: number; // Processing fee in cents

  @Column()
  feeType?: string; // 'platform_fee' | 'gateway_fee'

  @Column()
  netAmount?: number; // amount - fees

  // ─────────────────────────────────────────────────────────
  // Failure Handling (IMPROVEMENT #2)
  // ─────────────────────────────────────────────────────────

  @Column()
  failureReason?: string;

  @Column()
  failureCount: number = 0; // Retry attempts

  @Column()
  lastFailedAt?: Date;

  @Column()
  nextRetryAt?: Date; // Exponential backoff

  // ─────────────────────────────────────────────────────────
  // Audit Trail (IMPROVEMENT #3)
  // ─────────────────────────────────────────────────────────

  @Column()
  createdBy: ObjectId | string;

  @Column()
  updatedBy?: ObjectId | string;

  @Column()
  ipAddress?: string; // For fraud detection

  @Column()
  userAgent?: string;

  @Column()
  refundedAmount?: number; // Amount refunded in cents

  @Column()
  refundedAt?: Date;

  @Column()
  refundedBy?: ObjectId | string;

  @Column()
  refundReason?: string;

  // ─────────────────────────────────────────────────────────
  // Timestamps
  // ─────────────────────────────────────────────────────────

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @Column()
  deletedAt?: Date; // Soft delete for compliance
}

// ─────────────────────────────────────────────────────────
// MongoDB Indexes for Performance
// ─────────────────────────────────────────────────────────

/*
db.payments.createIndex({ tenantId: 1, createdAt: -1 })
db.payments.createIndex({ ownerId: 1, createdAt: -1 })
db.payments.createIndex({ leaseId: 1, createdAt: -1 })
db.payments.createIndex({ status: 1, dueDate: 1 })
db.payments.createIndex({ transactionId: 1 })
db.payments.createIndex({ idempotencyKey: 1 })
db.payments.createIndex({ stripePaymentIntentId: 1 })
db.payments.createIndex({ nextRetryAt: 1, status: 1 })
db.payments.createIndex({ createdAt: -1 })
*/
