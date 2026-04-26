import { vi, describe, it, expect, beforeEach } from 'vitest';
import api, { setAccessToken, setRefreshToken, clearTokens } from '../api';
import { authService } from '../auth.service';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
  clearTokens: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Registration & Login ────────────────────────────────

describe('authService.register', () => {
  it('should POST /auth/register, set tokens, and return response data', async () => {
    const mockData = {
      user: { id: '1' },
      tokens: { accessToken: 'at', refreshToken: 'rt' },
    };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const result = await authService.register({ email: 'a@b.com', password: 'pw', firstName: 'A', lastName: 'B' } as any);

    expect(api.post).toHaveBeenCalledWith('/auth/register', { email: 'a@b.com', password: 'pw', firstName: 'A', lastName: 'B' });
    expect(setAccessToken).toHaveBeenCalledWith('at');
    expect(setRefreshToken).toHaveBeenCalledWith('rt');
    expect(result).toEqual(mockData);
  });
});

describe('authService.login', () => {
  it('should POST /auth/login, set tokens, and return response data', async () => {
    const mockData = {
      user: { id: '1' },
      tokens: { accessToken: 'at', refreshToken: 'rt' },
    };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const result = await authService.login({ email: 'a@b.com', password: 'pw' });

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pw' });
    expect(setAccessToken).toHaveBeenCalledWith('at');
    expect(setRefreshToken).toHaveBeenCalledWith('rt');
    expect(result).toEqual(mockData);
  });
});

// ── Logout ──────────────────────────────────────────────

describe('authService.logout', () => {
  it('should POST /auth/logout and clear tokens', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    await authService.logout();

    expect(api.post).toHaveBeenCalledWith('/auth/logout', {});
    expect(clearTokens).toHaveBeenCalled();
  });

  it('should pass refreshToken when provided', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    await authService.logout('my-rt');

    expect(api.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'my-rt' });
  });

  it('should clear tokens even when the API call fails', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('network'));

    await expect(authService.logout()).rejects.toThrow('network');
    expect(clearTokens).toHaveBeenCalled();
  });
});

// ── OAuth helpers ───────────────────────────────────────

describe('authService.getGoogleLoginUrl', () => {
  it('should return a Google OAuth URL', () => {
    const url = authService.getGoogleLoginUrl();
    expect(url).toContain('/auth/google');
  });
});

describe('authService.handleGoogleCallback', () => {
  it('should set access and refresh tokens', () => {
    authService.handleGoogleCallback('at', 'rt');
    expect(setAccessToken).toHaveBeenCalledWith('at');
    expect(setRefreshToken).toHaveBeenCalledWith('rt');
  });
});

describe('authService.getFacebookLoginUrl', () => {
  it('should return a Facebook OAuth URL', () => {
    const url = authService.getFacebookLoginUrl();
    expect(url).toContain('/auth/facebook');
  });
});

describe('authService.handleFacebookCallback', () => {
  it('should set access and refresh tokens', () => {
    authService.handleFacebookCallback('at', 'rt');
    expect(setAccessToken).toHaveBeenCalledWith('at');
    expect(setRefreshToken).toHaveBeenCalledWith('rt');
  });
});

// ── Logout All ──────────────────────────────────────────

describe('authService.logoutAll', () => {
  it('should POST /auth/logout-all, clear tokens, and return data', async () => {
    const mockData = { message: 'ok', revokedCount: 3 };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const result = await authService.logoutAll();

    expect(api.post).toHaveBeenCalledWith('/auth/logout-all', {});
    expect(clearTokens).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  it('should pass currentSessionId when provided', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'ok', revokedCount: 1 } });

    await authService.logoutAll('sess-1');

    expect(api.post).toHaveBeenCalledWith('/auth/logout-all', { currentSessionId: 'sess-1' });
  });

  it('should clear tokens even when the API call fails', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('fail'));

    await expect(authService.logoutAll()).rejects.toThrow('fail');
    expect(clearTokens).toHaveBeenCalled();
  });
});

// ── User Information ────────────────────────────────────

describe('authService.getCurrentUser', () => {
  it('should GET /auth/me and return user data', async () => {
    const mockUser = { id: '1', email: 'a@b.com' };
    vi.mocked(api.get).mockResolvedValue({ data: mockUser });

    const result = await authService.getCurrentUser();

    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(mockUser);
  });
});

describe('authService.updateProfile', () => {
  it('should PUT /users/profile and return updated user', async () => {
    const mockUser = { id: '1', firstName: 'Updated' };
    vi.mocked(api.put).mockResolvedValue({ data: mockUser });

    const result = await authService.updateProfile({ firstName: 'Updated' } as any);

    expect(api.put).toHaveBeenCalledWith('/users/profile', { firstName: 'Updated' });
    expect(result).toEqual(mockUser);
  });
});

describe('authService.uploadAvatar', () => {
  it('should POST /upload/user/avatar with FormData', async () => {
    const mockResponse = { url: 'http://img.png', key: 'k' };
    vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

    const file = new File(['data'], 'avatar.png', { type: 'image/png' });
    const result = await authService.uploadAvatar(file);

    expect(api.post).toHaveBeenCalledWith(
      '/upload/user/avatar',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    expect(result).toEqual(mockResponse);
  });
});

describe('authService.getPreferences', () => {
  it('should GET /users/preferences', async () => {
    const mockPrefs = { theme: 'dark' };
    vi.mocked(api.get).mockResolvedValue({ data: mockPrefs });

    const result = await authService.getPreferences();

    expect(api.get).toHaveBeenCalledWith('/users/preferences');
    expect(result).toEqual(mockPrefs);
  });
});

describe('authService.updatePreferences', () => {
  it('should PUT /users/preferences', async () => {
    const mockPrefs = { theme: 'light' };
    vi.mocked(api.put).mockResolvedValue({ data: mockPrefs });

    const result = await authService.updatePreferences({ theme: 'light' } as any);

    expect(api.put).toHaveBeenCalledWith('/users/preferences', { theme: 'light' });
    expect(result).toEqual(mockPrefs);
  });
});

describe('authService.deactivateAccount', () => {
  it('should DELETE /users/deactivate', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { message: 'deactivated' } });

    const result = await authService.deactivateAccount();

    expect(api.delete).toHaveBeenCalledWith('/users/deactivate');
    expect(result).toEqual({ message: 'deactivated' });
  });
});

describe('authService.deleteAccountPermanently', () => {
  it('should DELETE /users/permanent-delete', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { message: 'deleted' } });

    const result = await authService.deleteAccountPermanently();

    expect(api.delete).toHaveBeenCalledWith('/users/permanent-delete');
    expect(result).toEqual({ message: 'deleted' });
  });
});

describe('authService.requestEmailChange', () => {
  it('should POST /auth/change-email-request', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'sent' } });

    const result = await authService.requestEmailChange({ newEmail: 'new@b.com', password: 'pw' } as any);

    expect(api.post).toHaveBeenCalledWith('/auth/change-email-request', { newEmail: 'new@b.com', password: 'pw' });
    expect(result).toEqual({ message: 'sent' });
  });
});

// ── Token Management ────────────────────────────────────

describe('authService.refreshTokens', () => {
  it('should POST /auth/refresh, set new tokens, and return data', async () => {
    const mockData = { accessToken: 'new-at', refreshToken: 'new-rt', expiresIn: 3600 };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const result = await authService.refreshTokens('old-rt');

    expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'old-rt' });
    expect(setAccessToken).toHaveBeenCalledWith('new-at');
    expect(setRefreshToken).toHaveBeenCalledWith('new-rt');
    expect(result).toEqual(mockData);
  });
});

// ── Email Verification ──────────────────────────────────

describe('authService.verifyEmail', () => {
  it('should POST /auth/verify-email', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'verified' } });

    const result = await authService.verifyEmail({ token: 'tok' } as any);

    expect(api.post).toHaveBeenCalledWith('/auth/verify-email', { token: 'tok' });
    expect(result).toEqual({ message: 'verified' });
  });
});

describe('authService.resendVerification', () => {
  it('should POST /auth/resend-verification', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'sent' } });

    const result = await authService.resendVerification('a@b.com');

    expect(api.post).toHaveBeenCalledWith('/auth/resend-verification', { email: 'a@b.com' });
    expect(result).toEqual({ message: 'sent' });
  });
});

// ── Password Management ─────────────────────────────────

describe('authService.forgotPassword', () => {
  it('should POST /auth/forgot-password', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'sent' } });

    const result = await authService.forgotPassword({ email: 'a@b.com' } as any);

    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'a@b.com' });
    expect(result).toEqual({ message: 'sent' });
  });
});

describe('authService.resetPassword', () => {
  it('should POST /auth/reset-password', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'reset' } });

    const result = await authService.resetPassword({ token: 't', password: 'pw' } as any);

    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token: 't', password: 'pw' });
    expect(result).toEqual({ message: 'reset' });
  });
});

describe('authService.changePassword', () => {
  it('should POST /auth/change-password', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'changed' } });

    const result = await authService.changePassword({ currentPassword: 'old', newPassword: 'new' } as any);

    expect(api.post).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'old', newPassword: 'new' });
    expect(result).toEqual({ message: 'changed' });
  });
});

// ── Session Management ──────────────────────────────────

describe('authService.getSessions', () => {
  it('should GET /auth/sessions', async () => {
    const mockSessions = [{ id: 's1' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockSessions });

    const result = await authService.getSessions();

    expect(api.get).toHaveBeenCalledWith('/auth/sessions');
    expect(result).toEqual(mockSessions);
  });
});

describe('authService.revokeSession', () => {
  it('should DELETE /auth/sessions/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { message: 'revoked' } });

    const result = await authService.revokeSession('s1');

    expect(api.delete).toHaveBeenCalledWith('/auth/sessions/s1');
    expect(result).toEqual({ message: 'revoked' });
  });
});

// ── Two-Factor Authentication ───────────────────────────

describe('authService.setup2FA', () => {
  it('should POST /auth/2fa/setup', async () => {
    const mockData = { secret: 'sec', qrCode: 'qr', otpauthUrl: 'url' };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const result = await authService.setup2FA();

    expect(api.post).toHaveBeenCalledWith('/auth/2fa/setup');
    expect(result).toEqual(mockData);
  });
});

describe('authService.enable2FA', () => {
  it('should POST /auth/2fa/enable with code', async () => {
    const mockData = { message: 'enabled', twoFactorEnabled: true };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const result = await authService.enable2FA('123456');

    expect(api.post).toHaveBeenCalledWith('/auth/2fa/enable', { code: '123456' });
    expect(result).toEqual(mockData);
  });
});

describe('authService.disable2FA', () => {
  it('should POST /auth/2fa/disable with password', async () => {
    const mockData = { message: 'disabled', twoFactorEnabled: false };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    const result = await authService.disable2FA('mypass');

    expect(api.post).toHaveBeenCalledWith('/auth/2fa/disable', { password: 'mypass' });
    expect(result).toEqual(mockData);
  });
});
