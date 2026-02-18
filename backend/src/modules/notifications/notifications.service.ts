// ===========================================
// SmartProperty - Notifications Service
// ===========================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { MongoRepository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: MongoRepository<Notification>,
  ) {}

  // ─── Create a notification ─────────────────────────────
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      link: dto.link,
      isRead: false,
    });

    const saved = await this.notificationRepo.save(notification);
    this.logger.log(
      `Notification created for user ${dto.userId}: ${dto.title}`,
    );
    return saved;
  }

  // ─── Get all notifications for a user ──────────────────
  async findAllForUser(userId: string) {
    const notifications = await this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return notifications.map((n) => ({
      id: n._id?.toHexString(),
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      link: n.link,
      createdAt: n.createdAt?.toISOString?.() || n.createdAt,
    }));
  }

  // ─── Get unread count ──────────────────────────────────
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  // ─── Mark one notification as read ─────────────────────
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { _id: new ObjectId(notificationId) },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    await this.notificationRepo.save(notification);
    return { success: true };
  }

  // ─── Mark all as read ──────────────────────────────────
  async markAllAsRead(userId: string) {
    const notifications = await this.notificationRepo.find({
      where: { userId, isRead: false },
    });

    for (const n of notifications) {
      n.isRead = true;
      await this.notificationRepo.save(n);
    }

    return { success: true, count: notifications.length };
  }

  // ─── Delete a notification ─────────────────────────────
  async delete(userId: string, notificationId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { _id: new ObjectId(notificationId) },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepo.delete(notification._id);
    return { success: true };
  }
}
