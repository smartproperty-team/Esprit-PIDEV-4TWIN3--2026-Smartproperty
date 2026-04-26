import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../api';
import { notificationService } from '../notification.service';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('notificationService.getAll', () => {
  it('should GET /notifications and return data', async () => {
    const mockData = [{ id: '1', title: 'Test' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await notificationService.getAll();

    expect(api.get).toHaveBeenCalledWith('/notifications');
    expect(result).toEqual(mockData);
  });
});

describe('notificationService.getUnreadCount', () => {
  it('should GET /notifications/unread-count and return the count', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { count: 5 } });

    const result = await notificationService.getUnreadCount();

    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
    expect(result).toBe(5);
  });
});

describe('notificationService.markAsRead', () => {
  it('should PATCH /notifications/:id/read', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: {} });

    await notificationService.markAsRead('n1');

    expect(api.patch).toHaveBeenCalledWith('/notifications/n1/read');
  });
});

describe('notificationService.markAllAsRead', () => {
  it('should PATCH /notifications/read-all', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: {} });

    await notificationService.markAllAsRead();

    expect(api.patch).toHaveBeenCalledWith('/notifications/read-all');
  });
});

describe('notificationService.delete', () => {
  it('should DELETE /notifications/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} });

    await notificationService.delete('n1');

    expect(api.delete).toHaveBeenCalledWith('/notifications/n1');
  });
});
