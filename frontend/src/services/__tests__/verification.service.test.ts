import { vi, describe, it, expect, beforeEach } from 'vitest';
import { api } from '../api';
import { verificationService } from '../verification.service';

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

describe('verificationService.getVerificationStatus', () => {
  it('should GET /verification/status and return data', async () => {
    const mockData = { status: 'pending', documents: [] };
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await verificationService.getVerificationStatus();

    expect(api.get).toHaveBeenCalledWith('/verification/status');
    expect(result).toEqual(mockData);
  });
});

describe('verificationService.uploadDocument', () => {
  it('should POST /verification/upload with FormData', async () => {
    const mockData = { id: 'd1', url: 'http://doc.pdf' };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const file = new File(['data'], 'id.pdf', { type: 'application/pdf' });
    const result = await verificationService.uploadDocument(file, 'identity' as any);

    expect(api.post).toHaveBeenCalledWith(
      '/verification/upload',
      expect.any(FormData),
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      },
    );
    expect(result).toEqual(mockData);
  });
});

describe('verificationService.deleteDocument', () => {
  it('should DELETE /verification/documents/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} });

    await verificationService.deleteDocument('d1');

    expect(api.delete).toHaveBeenCalledWith('/verification/documents/d1');
  });
});

describe('verificationService.submitForReview', () => {
  it('should POST /verification/submit and return data', async () => {
    const mockData = { status: 'pending_review' };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const result = await verificationService.submitForReview();

    expect(api.post).toHaveBeenCalledWith('/verification/submit');
    expect(result).toEqual(mockData);
  });
});

describe('verificationService.getDocuments', () => {
  it('should GET /verification/documents and return data', async () => {
    const mockData = [{ id: 'd1', type: 'identity' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await verificationService.getDocuments();

    expect(api.get).toHaveBeenCalledWith('/verification/documents');
    expect(result).toEqual(mockData);
  });
});

describe('verificationService.getAllVerifications', () => {
  it('should GET /verification/admin/all without status filter', async () => {
    const mockData = [{ id: 'v1' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await verificationService.getAllVerifications();

    expect(api.get).toHaveBeenCalledWith('/verification/admin/all', { params: {} });
    expect(result).toEqual(mockData);
  });

  it('should pass status filter when provided', async () => {
    const mockData = [{ id: 'v1', status: 'pending' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await verificationService.getAllVerifications('pending' as any);

    expect(api.get).toHaveBeenCalledWith('/verification/admin/all', { params: { status: 'pending' } });
    expect(result).toEqual(mockData);
  });
});

describe('verificationService.approveVerification', () => {
  it('should POST /verification/admin/:id/approve', async () => {
    const mockData = { status: 'approved' };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const result = await verificationService.approveVerification('v1');

    expect(api.post).toHaveBeenCalledWith('/verification/admin/v1/approve');
    expect(result).toEqual(mockData);
  });
});

describe('verificationService.rejectVerification', () => {
  it('should POST /verification/admin/:id/reject with reason', async () => {
    const mockData = { status: 'rejected' };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const result = await verificationService.rejectVerification('v1', 'Blurry document');

    expect(api.post).toHaveBeenCalledWith('/verification/admin/v1/reject', { reason: 'Blurry document' });
    expect(result).toEqual(mockData);
  });
});
