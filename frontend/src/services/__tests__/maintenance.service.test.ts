import { vi, describe, it, expect, beforeEach } from 'vitest';
import { api } from '../api';
import { maintenanceService } from '../maintenance.service';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  api: {
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

describe('maintenanceService.createRequest', () => {
  it('should POST /maintenance/requests and return the created request', async () => {
    const payload = { title: 'Broken pipe', description: 'Leaking' };
    const mockData = { id: 'r1', ...payload };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const result = await maintenanceService.createRequest(payload as any);

    expect(api.post).toHaveBeenCalledWith('/maintenance/requests', payload);
    expect(result).toEqual(mockData);
  });
});

describe('maintenanceService.getMyRequests', () => {
  it('should GET /maintenance/requests/mine', async () => {
    const mockData = [{ id: 'r1' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await maintenanceService.getMyRequests();

    expect(api.get).toHaveBeenCalledWith('/maintenance/requests/mine');
    expect(result).toEqual(mockData);
  });
});

describe('maintenanceService.getAssignedRequests', () => {
  it('should GET /maintenance/requests/assigned', async () => {
    const mockData = [{ id: 'r2' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await maintenanceService.getAssignedRequests();

    expect(api.get).toHaveBeenCalledWith('/maintenance/requests/assigned');
    expect(result).toEqual(mockData);
  });
});

describe('maintenanceService.getAvailableRequests', () => {
  it('should GET /maintenance/requests/available', async () => {
    const mockData = [{ id: 'r3' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await maintenanceService.getAvailableRequests();

    expect(api.get).toHaveBeenCalledWith('/maintenance/requests/available');
    expect(result).toEqual(mockData);
  });
});

describe('maintenanceService.claimRequest', () => {
  it('should PATCH /maintenance/requests/:id/claim', async () => {
    const mockData = { id: 'r1', status: 'claimed' };
    vi.mocked(api.patch).mockResolvedValue({ data: mockData });

    const result = await maintenanceService.claimRequest('r1');

    expect(api.patch).toHaveBeenCalledWith('/maintenance/requests/r1/claim');
    expect(result).toEqual(mockData);
  });
});

describe('maintenanceService.updateProviderStatus', () => {
  it('should PATCH /maintenance/requests/:id/provider-status with payload', async () => {
    const payload = { status: 'in_progress' as const };
    const mockData = { id: 'r1', status: 'in_progress' };
    vi.mocked(api.patch).mockResolvedValue({ data: mockData });

    const result = await maintenanceService.updateProviderStatus('r1', payload);

    expect(api.patch).toHaveBeenCalledWith('/maintenance/requests/r1/provider-status', payload);
    expect(result).toEqual(mockData);
  });
});

describe('maintenanceService.submitServiceReport', () => {
  it('should PATCH /maintenance/requests/:id/service-report with payload', async () => {
    const payload = { workPerformedSummary: 'Fixed the pipe', invoiceAmount: 150 };
    const mockData = { id: 'r1', ...payload };
    vi.mocked(api.patch).mockResolvedValue({ data: mockData });

    const result = await maintenanceService.submitServiceReport('r1', payload);

    expect(api.patch).toHaveBeenCalledWith('/maintenance/requests/r1/service-report', payload);
    expect(result).toEqual(mockData);
  });
});
