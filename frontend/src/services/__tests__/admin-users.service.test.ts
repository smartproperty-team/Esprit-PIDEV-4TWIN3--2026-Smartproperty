import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../api';
import { adminUsersService } from '../admin-users.service';

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

describe('adminUsersService.listUsers', () => {
  it('should GET /users with params and return response data', async () => {
    const mockData = { users: [{ id: '1' }], total: 1, page: 1, limit: 10 };
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const params = { page: 1, limit: 10, search: 'john' };
    const result = await adminUsersService.listUsers(params);

    expect(api.get).toHaveBeenCalledWith('/users', { params });
    expect(result).toEqual(mockData);
  });

  it('should pass role and status filters', async () => {
    const mockData = { users: [], total: 0, page: 1, limit: 10 };
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const params = { page: 1, limit: 10, role: 'admin' as any, status: 'active' as any };
    await adminUsersService.listUsers(params);

    expect(api.get).toHaveBeenCalledWith('/users', { params });
  });
});

describe('adminUsersService.getUserById', () => {
  it('should GET /users/:id and return user data', async () => {
    const mockUser = { id: 'u1', email: 'a@b.com' };
    vi.mocked(api.get).mockResolvedValue({ data: mockUser });

    const result = await adminUsersService.getUserById('u1');

    expect(api.get).toHaveBeenCalledWith('/users/u1');
    expect(result).toEqual(mockUser);
  });
});

describe('adminUsersService.updateUserStatus', () => {
  it('should PUT /users/:id/status with status payload', async () => {
    const mockUser = { id: 'u1', status: 'suspended' };
    vi.mocked(api.put).mockResolvedValue({ data: mockUser });

    const result = await adminUsersService.updateUserStatus('u1', 'suspended' as any);

    expect(api.put).toHaveBeenCalledWith('/users/u1/status', { status: 'suspended' });
    expect(result).toEqual(mockUser);
  });
});

describe('adminUsersService.updateUserRole', () => {
  it('should PUT /users/:id/role with role payload', async () => {
    const mockUser = { id: 'u1', role: 'admin' };
    vi.mocked(api.put).mockResolvedValue({ data: mockUser });

    const result = await adminUsersService.updateUserRole('u1', 'admin' as any);

    expect(api.put).toHaveBeenCalledWith('/users/u1/role', { role: 'admin' });
    expect(result).toEqual(mockUser);
  });
});
