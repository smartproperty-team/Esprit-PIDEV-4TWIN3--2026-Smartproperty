// ===========================================
// SmartProperty - Create Payment DTO
// ===========================================

import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { PaymentType, PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsString()
  leaseId: string;

  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1) // Minimum 1 cent
  amount: number; // in cents

  @IsOptional()
  @IsString()
  currency: string = 'USD';

  @IsNotEmpty()
  @IsEnum(PaymentType)
  type: PaymentType;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string; // Prevents duplicate charges

  @IsOptional()
  @IsString()
  invoiceId?: string;
}
