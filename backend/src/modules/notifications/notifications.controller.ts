// ===========================================
// SmartProperty - Notifications Controller
// ===========================================

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { BadRequestException, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private resolveUserId(user: any, userId?: string): string {
    const resolved =
      userId ||
      user?.id ||
      user?._id?.toHexString?.() ||
      user?._id?.toString?.();

    if (!resolved) {
      throw new BadRequestException('Authenticated user id is missing');
    }

    return resolved;
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  async findAll(@CurrentUser() user: any, @CurrentUser('id') userId?: string) {
    return this.notificationsService.findAllForUser(
      this.resolveUserId(user, userId),
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() user: any, @CurrentUser('id') userId?: string) {
    const count = await this.notificationsService.getUnreadCount(
      this.resolveUserId(user, userId),
    );
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @CurrentUser() user: any,
    @CurrentUser('id') userId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(
      this.resolveUserId(user, userId),
      id,
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: any, @CurrentUser('id') userId?: string) {
    return this.notificationsService.markAllAsRead(
      this.resolveUserId(user, userId),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async delete(
    @CurrentUser() user: any,
    @CurrentUser('id') userId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.notificationsService.delete(this.resolveUserId(user, userId), id);
  }
}
