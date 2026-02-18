// ===========================================
// SmartProperty - Notifications Controller
// ===========================================

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  async findAll(@Req() req: any) {
    const userId = req.user._id?.toHexString?.() || req.user._id?.toString();
    return this.notificationsService.findAllForUser(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: any) {
    const userId = req.user._id?.toHexString?.() || req.user._id?.toString();
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user._id?.toHexString?.() || req.user._id?.toString();
    return this.notificationsService.markAsRead(userId, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: any) {
    const userId = req.user._id?.toHexString?.() || req.user._id?.toString();
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user._id?.toHexString?.() || req.user._id?.toString();
    return this.notificationsService.delete(userId, id);
  }
}
