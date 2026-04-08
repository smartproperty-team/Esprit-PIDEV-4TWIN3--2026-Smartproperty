// ===========================================
// SmartProperty - AI Description DTOs
// ===========================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export const AI_DESCRIPTION_TONES = ['professional', 'warm', 'luxury'] as const;
export type AiDescriptionTone = (typeof AI_DESCRIPTION_TONES)[number];

export const AI_DESCRIPTION_LENGTHS = ['short', 'medium', 'long'] as const;
export type AiDescriptionLength = (typeof AI_DESCRIPTION_LENGTHS)[number];

export class PropertySnapshotDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() neighborhood?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() bedrooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() bathrooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() areaSqft?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() yearBuilt?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() furnished?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() petFriendly?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() parkingSpaces?: number;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nearby?: string[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() price?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
}

export class GenerateDescriptionDto {
  @ApiPropertyOptional({ description: 'Existing property id (optional for drafts)' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ type: PropertySnapshotDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PropertySnapshotDto)
  propertySnapshot?: PropertySnapshotDto;

  @ApiProperty({ enum: AI_DESCRIPTION_TONES, default: 'professional' })
  @IsString()
  @IsIn(AI_DESCRIPTION_TONES as unknown as string[])
  tone!: AiDescriptionTone;

  @ApiProperty({
    enum: AI_DESCRIPTION_LENGTHS,
    isArray: true,
    example: ['short', 'medium'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(AI_DESCRIPTION_LENGTHS as unknown as string[], { each: true })
  lengths!: AiDescriptionLength[];

  @ApiProperty({ example: 'en' })
  @IsString()
  @IsNotEmpty()
  sourceLanguage!: string;

  @ApiProperty({ type: [String], example: ['en', 'fr'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  targetLanguages!: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hintKeywords?: string[];
}

export class GeneratedVariantDto {
  @ApiProperty() length!: AiDescriptionLength;
  @ApiProperty() tone!: AiDescriptionTone;
  @ApiProperty() language!: string;
  @ApiProperty() text!: string;
  @ApiProperty() wordCount!: number;
}

export class GenerationMetadataDto {
  @ApiProperty() generationId!: string;
  @ApiProperty() modelName!: string;
  @ApiProperty() modelVersion!: string;
  @ApiProperty() cacheHit!: boolean;
  @ApiProperty() latencyMs!: number;
  @ApiPropertyOptional() propertyId?: string;
}

export class GenerateDescriptionResponseDto {
  @ApiProperty({ type: [GeneratedVariantDto] })
  variants!: GeneratedVariantDto[];

  @ApiProperty({ type: GenerationMetadataDto })
  metadata!: GenerationMetadataDto;
}
