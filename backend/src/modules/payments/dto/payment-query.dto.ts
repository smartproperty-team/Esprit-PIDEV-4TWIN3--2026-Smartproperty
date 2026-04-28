// ===========================================
// SmartProperty - Payment Query DTOs
// ===========================================

import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  PaymentType,
  PaymentStatus,
  PaymentMethod,
} from '../entities/payment.entity';

export class PaymentQueryDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @IsOptional()
  @IsISO8601()
  startDate?: string; // 'YYYY-MM-DD'

  @IsOptional()
  @IsISO8601()
  endDate?: string; // 'YYYY-MM-DD'

  @IsOptional()
  @IsString()
  leaseId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number = 10;

  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  sortOrder: 'asc' | 'desc' = 'desc';
}

export class ExportPaymentQueryDto extends PaymentQueryDto {
  @IsOptional()
  @IsString()
  format: 'excel' | 'csv' = 'excel';
}
