// ===========================================
// SmartProperty - Properties Module
// ===========================================

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadModule } from '../upload/upload.module';
import { AiDescriptionService } from './ai-description.service';
import { AiPricingService } from './ai-pricing.service';
import { Property } from './entities/property.entity';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertyImagesController } from './property-images.controller';
import { PropertyImagesService } from './property-images.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property]),
    UploadModule, // For MinIO service
  ],
  providers: [PropertiesService, PropertyImagesService, AiDescriptionService, AiPricingService],
  controllers: [PropertiesController, PropertyImagesController],
  exports: [PropertiesService, PropertyImagesService, TypeOrmModule],
})
export class PropertiesModule {}
