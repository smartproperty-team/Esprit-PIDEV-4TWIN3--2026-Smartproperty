// ===========================================
// SmartProperty - App Controller
// ===========================================

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { ApiInfo, HealthCheck } from './app.service';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Root endpoint - Returns API information
   */
  @Get()
  @ApiOperation({ summary: 'Get API information' })
  @ApiResponse({
    status: 200,
    description: 'API information retrieved successfully',
  })
  getApiInfo(): ApiInfo {
    return this.appService.getApiInfo();
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): HealthCheck {
    return this.appService.getHealth();
  }
}
