// ===========================================
// SmartProperty - Notification Service
// ===========================================

import api from './api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'verification_approved' | 'verification_rejected' | 'system' | 'info';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export const notificationService = {
  // Get all notifications
  async getAll(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/api/notifications');
    return response.data;
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>(
      '/api/notifications/unread-count',
    );
    return response.data.count;
  },

  // Mark one as read
  async markAsRead(id: string): Promise<void> {
    await api.patch(`/api/notifications/${id}/read`);
  },

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    await api.patch('/api/notifications/read-all');
  },

  // Delete a notification
  async delete(id: string): Promise<void> {
    await api.delete(`/api/notifications/${id}`);
  },
};

export default notificationService;
