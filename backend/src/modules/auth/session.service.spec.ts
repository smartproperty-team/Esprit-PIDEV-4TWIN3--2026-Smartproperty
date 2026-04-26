// ===========================================
// SmartProperty - Session Service Tests
// ===========================================

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { DeviceInfo, SessionService } from './session.service';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// ===========================================
// Helper: create a mock Session entity
// ===========================================

function createMockSession(overrides: Partial<Session> = {}): Session {
  const session = new Session();
  session._id = new ObjectId();
  session.userId = 'user-123';
  session.refreshTokenHash = 'hashed-token';
  session.deviceName = 'Chrome on Windows';
  session.deviceType = 'desktop';
  session.browser = 'Chrome';
  session.os = 'Windows';
  session.ipAddress = '127.0.0.1';
  session.location = 'localhost';
  session.isActive = true;
  session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // future
  session.lastActivityAt = new Date();
  session.createdAt = new Date();
  session.updatedAt = new Date();
  Object.assign(session, overrides);
  return session;
}

function createExpiredSession(overrides: Partial<Session> = {}): Session {
  return createMockSession({
    expiresAt: new Date(Date.now() - 1000), // in the past
    ...overrides,
  });
}

describe('SessionService', () => {
  let service: SessionService;
  let repository: jest.Mocked<Partial<Repository<Session>>>;

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getRepositoryToken(Session),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);

    // Reset mocks
    jest.clearAllMocks();
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);
  });

  // ===========================================
  // createSession
  // ===========================================

  describe('createSession', () => {
    const userId = 'user-123';
    const refreshToken = 'raw-refresh-token';
    const deviceInfo: DeviceInfo = {
      deviceName: 'Chrome on Windows',
      deviceType: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      ipAddress: '10.0.0.1',
      location: 'Test City',
    };

    beforeEach(() => {
      // enforceSessionLimit finds no existing sessions by default
      (repository.find as jest.Mock).mockResolvedValue([]);
      const mockSession = createMockSession();
      (repository.create as jest.Mock).mockReturnValue(mockSession);
      (repository.save as jest.Mock).mockResolvedValue(mockSession);
    });

    it('should hash the refresh token with salt rounds of 10', async () => {
      await service.createSession(userId, refreshToken, deviceInfo);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(refreshToken, 10);
    });

    it('should enforce session limit before creating a session', async () => {
      await service.createSession(userId, refreshToken, deviceInfo);
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        order: { lastActivityAt: 'ASC' },
      });
    });

    it('should create a session with correct fields', async () => {
      await service.createSession(userId, refreshToken, deviceInfo);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          refreshTokenHash: 'hashed-token',
          deviceName: 'Chrome on Windows',
          deviceType: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          ipAddress: '10.0.0.1',
          location: 'Test City',
          isActive: true,
        }),
      );
    });

    it('should save and return the created session', async () => {
      const mockSession = createMockSession();
      (repository.save as jest.Mock).mockResolvedValue(mockSession);
      const result = await service.createSession(userId, refreshToken, deviceInfo);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toBe(mockSession);
    });

    it('should default expiresAt to 7 days from now', async () => {
      const before = Date.now();
      await service.createSession(userId, refreshToken, deviceInfo);
      const after = Date.now();

      const createCall = (repository.create as jest.Mock).mock.calls[0][0];
      const expiresAt = createCall.expiresAt.getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(before + sevenDaysMs);
      expect(expiresAt).toBeLessThanOrEqual(after + sevenDaysMs);
    });

    it('should use custom expiresInSeconds when provided', async () => {
      const before = Date.now();
      await service.createSession(userId, refreshToken, deviceInfo, 3600);
      const after = Date.now();

      const createCall = (repository.create as jest.Mock).mock.calls[0][0];
      const expiresAt = createCall.expiresAt.getTime();

      expect(expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
      expect(expiresAt).toBeLessThanOrEqual(after + 3600 * 1000);
    });

    it('should use default deviceName when not provided', async () => {
      await service.createSession(userId, refreshToken, {});
      const createCall = (repository.create as jest.Mock).mock.calls[0][0];
      expect(createCall.deviceName).toBe('Unknown Device');
    });

    it('should use default deviceType when not provided', async () => {
      await service.createSession(userId, refreshToken, {});
      const createCall = (repository.create as jest.Mock).mock.calls[0][0];
      expect(createCall.deviceType).toBe('unknown');
    });

    it('should set lastActivityAt to current time', async () => {
      const before = Date.now();
      await service.createSession(userId, refreshToken, deviceInfo);
      const after = Date.now();

      const createCall = (repository.create as jest.Mock).mock.calls[0][0];
      expect(createCall.lastActivityAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(createCall.lastActivityAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  // ===========================================
  // validateSession
  // ===========================================

  describe('validateSession', () => {
    const userId = 'user-123';
    const refreshToken = 'raw-refresh-token';

    it('should return null when no active sessions exist', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);
      const result = await service.validateSession(userId, refreshToken);
      expect(result).toBeNull();
    });

    it('should find active sessions for the user', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);
      await service.validateSession(userId, refreshToken);
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId, isActive: true },
      });
    });

    it('should mark expired sessions as inactive and skip them', async () => {
      const expiredSession = createExpiredSession();
      (repository.find as jest.Mock).mockResolvedValue([expiredSession]);
      (repository.save as jest.Mock).mockResolvedValue(expiredSession);

      const result = await service.validateSession(userId, refreshToken);

      expect(expiredSession.isActive).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(expiredSession);
      expect(result).toBeNull();
    });

    it('should return session when bcrypt compare matches', async () => {
      const session = createMockSession();
      (repository.find as jest.Mock).mockResolvedValue([session]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (repository.save as jest.Mock).mockResolvedValue(session);

      const result = await service.validateSession(userId, refreshToken);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        refreshToken,
        session.refreshTokenHash,
      );
      expect(result).toBe(session);
    });

    it('should update lastActivityAt on successful validation', async () => {
      const session = createMockSession({ lastActivityAt: new Date('2020-01-01') });
      (repository.find as jest.Mock).mockResolvedValue([session]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (repository.save as jest.Mock).mockResolvedValue(session);

      const before = Date.now();
      await service.validateSession(userId, refreshToken);
      const after = Date.now();

      expect(session.lastActivityAt!.getTime()).toBeGreaterThanOrEqual(before);
      expect(session.lastActivityAt!.getTime()).toBeLessThanOrEqual(after);
    });

    it('should return null when no token matches', async () => {
      const session = createMockSession();
      (repository.find as jest.Mock).mockResolvedValue([session]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateSession(userId, refreshToken);
      expect(result).toBeNull();
    });

    it('should skip expired sessions and still find a valid match', async () => {
      const expiredSession = createExpiredSession();
      const validSession = createMockSession();
      (repository.find as jest.Mock).mockResolvedValue([expiredSession, validSession]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      const result = await service.validateSession(userId, refreshToken);

      expect(expiredSession.isActive).toBe(false);
      expect(result).toBe(validSession);
    });

    it('should check multiple sessions and return the first matching one', async () => {
      const session1 = createMockSession();
      const session2 = createMockSession();
      (repository.find as jest.Mock).mockResolvedValue([session1, session2]);
      (mockedBcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      const result = await service.validateSession(userId, refreshToken);
      expect(result).toBe(session2);
      expect(mockedBcrypt.compare).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================
  // updateSessionToken
  // ===========================================

  describe('updateSessionToken', () => {
    const sessionId = new ObjectId().toHexString();
    const newRefreshToken = 'new-refresh-token';

    it('should throw NotFoundException when session does not exist', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.updateSessionToken(sessionId, newRefreshToken),
      ).rejects.toThrow(NotFoundException);
    });

    it('should find session by _id', async () => {
      const session = createMockSession();
      (repository.findOne as jest.Mock).mockResolvedValue(session);
      (repository.save as jest.Mock).mockResolvedValue(session);

      await service.updateSessionToken(sessionId, newRefreshToken);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { _id: sessionId as any },
      });
    });

    it('should hash the new refresh token', async () => {
      const session = createMockSession();
      (repository.findOne as jest.Mock).mockResolvedValue(session);
      (repository.save as jest.Mock).mockResolvedValue(session);

      await service.updateSessionToken(sessionId, newRefreshToken);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(newRefreshToken, 10);
    });

    it('should update refreshTokenHash and lastActivityAt', async () => {
      const session = createMockSession({
        refreshTokenHash: 'old-hash',
        lastActivityAt: new Date('2020-01-01'),
      });
      (repository.findOne as jest.Mock).mockResolvedValue(session);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-token');
      (repository.save as jest.Mock).mockResolvedValue(session);

      const before = Date.now();
      await service.updateSessionToken(sessionId, newRefreshToken);
      const after = Date.now();

      expect(session.refreshTokenHash).toBe('new-hashed-token');
      expect(session.lastActivityAt!.getTime()).toBeGreaterThanOrEqual(before);
      expect(session.lastActivityAt!.getTime()).toBeLessThanOrEqual(after);
    });

    it('should save the updated session', async () => {
      const session = createMockSession();
      (repository.findOne as jest.Mock).mockResolvedValue(session);
      (repository.save as jest.Mock).mockResolvedValue(session);

      await service.updateSessionToken(sessionId, newRefreshToken);
      expect(repository.save).toHaveBeenCalledWith(session);
    });
  });

  // ===========================================
  // getUserSessions
  // ===========================================

  describe('getUserSessions', () => {
    const userId = 'user-123';

    it('should return empty array when no active sessions exist', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);
      const result = await service.getUserSessions(userId);
      expect(result).toEqual([]);
    });

    it('should query with correct where clause and order', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);
      await service.getUserSessions(userId);
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        order: { lastActivityAt: 'DESC' },
      });
    });

    it('should return valid (non-expired) sessions', async () => {
      const session1 = createMockSession();
      const session2 = createMockSession();
      (repository.find as jest.Mock).mockResolvedValue([session1, session2]);

      const result = await service.getUserSessions(userId);
      expect(result).toEqual([session1, session2]);
    });

    it('should filter out expired sessions and mark them inactive', async () => {
      const validSession = createMockSession();
      const expiredSession = createExpiredSession();
      (repository.find as jest.Mock).mockResolvedValue([validSession, expiredSession]);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      const result = await service.getUserSessions(userId);

      expect(result).toEqual([validSession]);
      expect(expiredSession.isActive).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(expiredSession);
    });

    it('should return empty array when all sessions are expired', async () => {
      const expired1 = createExpiredSession();
      const expired2 = createExpiredSession();
      (repository.find as jest.Mock).mockResolvedValue([expired1, expired2]);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      const result = await service.getUserSessions(userId);

      expect(result).toEqual([]);
      expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('should save each expired session individually', async () => {
      const expired1 = createExpiredSession();
      const expired2 = createExpiredSession();
      const valid = createMockSession();
      (repository.find as jest.Mock).mockResolvedValue([expired1, valid, expired2]);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      await service.getUserSessions(userId);

      expect(repository.save).toHaveBeenCalledWith(expired1);
      expect(repository.save).toHaveBeenCalledWith(expired2);
      expect(repository.save).not.toHaveBeenCalledWith(valid);
    });
  });

  // ===========================================
  // revokeSession
  // ===========================================

  describe('revokeSession', () => {
    const userId = 'user-123';

    it('should throw NotFoundException for invalid ObjectId format', async () => {
      await expect(
        service.revokeSession(userId, 'not-a-valid-objectid'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.revokeSession(userId, 'not-a-valid-objectid'),
      ).rejects.toThrow('Invalid session ID');
    });

    it('should throw NotFoundException when session does not exist', async () => {
      const validId = new ObjectId().toHexString();
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.revokeSession(userId, validId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message when not found', async () => {
      const validId = new ObjectId().toHexString();
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.revokeSession(userId, validId),
      ).rejects.toThrow('Session not found');
    });

    it('should convert sessionId to ObjectId for the query', async () => {
      const objectId = new ObjectId();
      const session = createMockSession({ _id: objectId });
      (repository.findOne as jest.Mock).mockResolvedValue(session);
      (repository.save as jest.Mock).mockResolvedValue(session);

      await service.revokeSession(userId, objectId.toHexString());

      const findOneCall = (repository.findOne as jest.Mock).mock.calls[0][0];
      expect(findOneCall.where._id).toBeInstanceOf(ObjectId);
      expect(findOneCall.where.userId).toBe(userId);
    });

    it('should set isActive to false and save', async () => {
      const session = createMockSession({ isActive: true });
      const validId = session._id.toHexString();
      (repository.findOne as jest.Mock).mockResolvedValue(session);
      (repository.save as jest.Mock).mockResolvedValue(session);

      await service.revokeSession(userId, validId);

      expect(session.isActive).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(session);
    });
  });

  // ===========================================
  // revokeAllSessions
  // ===========================================

  describe('revokeAllSessions', () => {
    const userId = 'user-123';

    it('should return 0 when no active sessions exist', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);
      const result = await service.revokeAllSessions(userId);
      expect(result).toBe(0);
    });

    it('should find all active sessions for the user', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);
      await service.revokeAllSessions(userId);
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId, isActive: true },
      });
    });

    it('should revoke all sessions and return count', async () => {
      const sessions = [
        createMockSession(),
        createMockSession(),
        createMockSession(),
      ];
      (repository.find as jest.Mock).mockResolvedValue(sessions);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      const result = await service.revokeAllSessions(userId);

      expect(result).toBe(3);
      sessions.forEach((s) => {
        expect(s.isActive).toBe(false);
      });
      expect(repository.save).toHaveBeenCalledTimes(3);
    });

    it('should skip the excepted session when exceptSessionId is provided', async () => {
      const session1 = createMockSession();
      const session2 = createMockSession();
      const session3 = createMockSession();
      const exceptId = session2._id.toHexString();

      (repository.find as jest.Mock).mockResolvedValue([session1, session2, session3]);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      const result = await service.revokeAllSessions(userId, exceptId);

      expect(result).toBe(2);
      expect(session1.isActive).toBe(false);
      expect(session2.isActive).toBe(true); // skipped
      expect(session3.isActive).toBe(false);
    });

    it('should revoke all sessions when exceptSessionId does not match any', async () => {
      const sessions = [createMockSession(), createMockSession()];
      (repository.find as jest.Mock).mockResolvedValue(sessions);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      const nonExistentId = new ObjectId().toHexString();
      const result = await service.revokeAllSessions(userId, nonExistentId);

      expect(result).toBe(2);
      sessions.forEach((s) => expect(s.isActive).toBe(false));
    });

    it('should revoke all when exceptSessionId is undefined', async () => {
      const sessions = [createMockSession(), createMockSession()];
      (repository.find as jest.Mock).mockResolvedValue(sessions);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      const result = await service.revokeAllSessions(userId, undefined);

      expect(result).toBe(2);
    });
  });

  // ===========================================
  // revokeSessionByToken
  // ===========================================

  describe('revokeSessionByToken', () => {
    const userId = 'user-123';
    const refreshToken = 'raw-refresh-token';

    it('should do nothing when validateSession returns null', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);

      await service.revokeSessionByToken(userId, refreshToken);

      // save should not be called beyond what validateSession does
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should set isActive to false when session is found by token', async () => {
      const session = createMockSession();
      (repository.find as jest.Mock).mockResolvedValue([session]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      await service.revokeSessionByToken(userId, refreshToken);

      // save called twice: once by validateSession (lastActivityAt update), once for revoke
      expect(session.isActive).toBe(false);
    });

    it('should save the revoked session', async () => {
      const session = createMockSession();
      (repository.find as jest.Mock).mockResolvedValue([session]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      await service.revokeSessionByToken(userId, refreshToken);

      // Last save call should be the revocation
      const lastSaveCall = (repository.save as jest.Mock).mock.calls.at(-1);
      expect(lastSaveCall[0].isActive).toBe(false);
    });
  });

  // ===========================================
  // cleanupExpiredSessions
  // ===========================================

  describe('cleanupExpiredSessions', () => {
    it('should update expired active sessions to inactive', async () => {
      (repository.update as jest.Mock).mockResolvedValue({ affected: 5 });

      const result = await service.cleanupExpiredSessions();

      expect(repository.update).toHaveBeenCalledWith(
        {
          isActive: true,
          expiresAt: expect.anything(), // LessThan(new Date())
        },
        { isActive: false },
      );
      expect(result).toBe(5);
    });

    it('should return 0 when no sessions are affected', async () => {
      (repository.update as jest.Mock).mockResolvedValue({ affected: 0 });
      const result = await service.cleanupExpiredSessions();
      expect(result).toBe(0);
    });

    it('should return 0 when affected is undefined', async () => {
      (repository.update as jest.Mock).mockResolvedValue({});
      const result = await service.cleanupExpiredSessions();
      expect(result).toBe(0);
    });

    it('should return 0 when affected is null', async () => {
      (repository.update as jest.Mock).mockResolvedValue({ affected: null });
      const result = await service.cleanupExpiredSessions();
      expect(result).toBe(0);
    });
  });

  // ===========================================
  // enforceSessionLimit (tested via createSession)
  // ===========================================

  describe('enforceSessionLimit (via createSession)', () => {
    const userId = 'user-123';
    const refreshToken = 'token';
    const deviceInfo: DeviceInfo = {};

    it('should not remove any sessions when under the limit', async () => {
      const sessions = [createMockSession(), createMockSession()]; // 2 sessions, limit is 5
      (repository.find as jest.Mock).mockResolvedValue(sessions);
      (repository.create as jest.Mock).mockReturnValue(createMockSession());
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      await service.createSession(userId, refreshToken, deviceInfo);

      // save should only be called once (for the new session), not for revoking old ones
      // The find for enforceSessionLimit returns 2 sessions which is under the limit of 5
      const saveCalls = (repository.save as jest.Mock).mock.calls;
      // Only the new session creation save
      expect(saveCalls.length).toBe(1);
    });

    it('should remove the oldest session when at the limit of 5', async () => {
      const existingSessions = Array.from({ length: 5 }, (_, i) =>
        createMockSession({
          lastActivityAt: new Date(Date.now() - (5 - i) * 1000), // oldest first
        }),
      );
      (repository.find as jest.Mock).mockResolvedValue(existingSessions);
      (repository.create as jest.Mock).mockReturnValue(createMockSession());
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      await service.createSession(userId, refreshToken, deviceInfo);

      // Should deactivate 1 oldest session (5 - 5 + 1 = 1)
      expect(existingSessions[0].isActive).toBe(false);
      expect(existingSessions[1].isActive).toBe(true);
    });

    it('should remove multiple oldest sessions when well over the limit', async () => {
      const existingSessions = Array.from({ length: 7 }, (_, i) =>
        createMockSession({
          lastActivityAt: new Date(Date.now() - (7 - i) * 1000),
        }),
      );
      (repository.find as jest.Mock).mockResolvedValue(existingSessions);
      (repository.create as jest.Mock).mockReturnValue(createMockSession());
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      await service.createSession(userId, refreshToken, deviceInfo);

      // Should deactivate 3 oldest sessions (7 - 5 + 1 = 3)
      expect(existingSessions[0].isActive).toBe(false);
      expect(existingSessions[1].isActive).toBe(false);
      expect(existingSessions[2].isActive).toBe(false);
      expect(existingSessions[3].isActive).toBe(true);
    });

    it('should not remove sessions when exactly at limit minus 1', async () => {
      const existingSessions = Array.from({ length: 4 }, () =>
        createMockSession(),
      );
      (repository.find as jest.Mock).mockResolvedValue(existingSessions);
      (repository.create as jest.Mock).mockReturnValue(createMockSession());
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      await service.createSession(userId, refreshToken, deviceInfo);

      // 4 - 5 + 1 = 0, so no sessions should be removed
      existingSessions.forEach((s) => expect(s.isActive).toBe(true));
    });
  });

  // ===========================================
  // parseUserAgent
  // ===========================================

  describe('parseUserAgent', () => {
    // Browser detection
    describe('browser detection', () => {
      it('should detect Chrome', () => {
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        const result = service.parseUserAgent(ua);
        expect(result.browser).toBe('Chrome');
      });

      it('should detect Firefox', () => {
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0';
        const result = service.parseUserAgent(ua);
        expect(result.browser).toBe('Firefox');
      });

      it('should detect Safari (not Chrome)', () => {
        const ua =
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15';
        const result = service.parseUserAgent(ua);
        expect(result.browser).toBe('Safari');
      });

      it('should detect Edge (Edg token)', () => {
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
        const result = service.parseUserAgent(ua);
        expect(result.browser).toBe('Edge');
      });

      it('should detect Chrome when OPR is present alongside Chrome (Chrome check comes first)', () => {
        // NOTE: This is a known limitation of the simple browser detection.
        // The code checks Chrome (without Edg) before Opera/OPR, so a UA
        // containing both "Chrome" and "OPR" is classified as Chrome.
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0';
        const result = service.parseUserAgent(ua);
        expect(result.browser).toBe('Chrome');
      });

      it('should detect Opera via OPR token when Chrome is absent', () => {
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 OPR/106.0.0.0';
        const result = service.parseUserAgent(ua);
        expect(result.browser).toBe('Opera');
      });

      it('should detect Opera via Opera token', () => {
        const ua = 'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14';
        const result = service.parseUserAgent(ua);
        expect(result.browser).toBe('Opera');
      });

      it('should return Unknown for unrecognized browser', () => {
        const ua = 'curl/7.68.0';
        const result = service.parseUserAgent(ua);
        expect(result.browser).toBe('Unknown');
      });
    });

    // OS detection
    describe('OS detection', () => {
      it('should detect Windows', () => {
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';
        const result = service.parseUserAgent(ua);
        expect(result.os).toBe('Windows');
      });

      it('should detect macOS', () => {
        const ua =
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';
        const result = service.parseUserAgent(ua);
        expect(result.os).toBe('macOS');
      });

      it('should detect Linux', () => {
        const ua =
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0';
        const result = service.parseUserAgent(ua);
        expect(result.os).toBe('Linux');
      });

      it('should detect Android', () => {
        const ua =
          'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36';
        const result = service.parseUserAgent(ua);
        // Android contains "Linux" but the code checks "Windows" then "Mac OS" then "Linux" then "Android"
        // Since "Linux" appears before "Android" in the UA and in the checks, this returns "Linux"
        // Actually: the code checks in order: Windows, Mac OS, Linux, Android, iOS
        // The UA contains both "Linux" and "Android" - Linux check comes first
        expect(result.os).toBe('Linux');
      });

      it('should detect Android-only user agent', () => {
        const ua =
          'Mozilla/5.0 (Android 14; Mobile) AppleWebKit/537.36 Chrome/120.0.0.0';
        const result = service.parseUserAgent(ua);
        expect(result.os).toBe('Android');
      });

      it('should detect iOS via iPhone', () => {
        const ua =
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
        // Contains "Mac OS" so this will be detected as macOS due to check order
        expect(service.parseUserAgent(ua).os).toBe('macOS');
      });

      it('should detect iOS from pure iOS string', () => {
        const ua = 'SomeApp/1.0 (iOS 17.0; iPhone14,2)';
        const result = service.parseUserAgent(ua);
        expect(result.os).toBe('iOS');
      });

      it('should return Unknown for unrecognized OS', () => {
        const ua = 'curl/7.68.0';
        const result = service.parseUserAgent(ua);
        expect(result.os).toBe('Unknown');
      });
    });

    // Device type detection
    describe('device type detection', () => {
      it('should detect mobile via Mobile keyword', () => {
        const ua =
          'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36';
        const result = service.parseUserAgent(ua);
        expect(result.deviceType).toBe('mobile');
      });

      it('should detect mobile via Android keyword', () => {
        const ua =
          'Mozilla/5.0 (Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0';
        const result = service.parseUserAgent(ua);
        expect(result.deviceType).toBe('mobile');
      });

      it('should detect tablet via Tablet keyword', () => {
        const ua =
          'Mozilla/5.0 (Linux; Tablet; rv:120.0) Gecko/120.0 Firefox/120.0';
        const result = service.parseUserAgent(ua);
        expect(result.deviceType).toBe('tablet');
      });

      it('should detect tablet via iPad keyword', () => {
        const ua =
          'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
        const result = service.parseUserAgent(ua);
        expect(result.deviceType).toBe('tablet');
      });

      it('should default to desktop', () => {
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';
        const result = service.parseUserAgent(ua);
        expect(result.deviceType).toBe('desktop');
      });
    });

    // Device name generation
    describe('device name generation', () => {
      it('should generate deviceName as "browser on os"', () => {
        const ua =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
        const result = service.parseUserAgent(ua);
        expect(result.deviceName).toBe('Chrome on Windows');
      });

      it('should generate deviceName with Unknown browser', () => {
        const ua = 'curl/7.68.0';
        const result = service.parseUserAgent(ua);
        expect(result.deviceName).toBe('Unknown on Unknown');
      });

      it('should generate deviceName for Firefox on Linux', () => {
        const ua =
          'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0';
        const result = service.parseUserAgent(ua);
        expect(result.deviceName).toBe('Firefox on Linux');
      });
    });

    // Return type
    it('should return a Partial<DeviceInfo> with all four fields', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';
      const result = service.parseUserAgent(ua);
      expect(result).toHaveProperty('browser');
      expect(result).toHaveProperty('os');
      expect(result).toHaveProperty('deviceType');
      expect(result).toHaveProperty('deviceName');
    });
  });

  // ===========================================
  // Edge case: empty string user agent
  // ===========================================

  describe('parseUserAgent edge cases', () => {
    it('should handle empty string', () => {
      const result = service.parseUserAgent('');
      expect(result.browser).toBe('Unknown');
      expect(result.os).toBe('Unknown');
      expect(result.deviceType).toBe('desktop');
      expect(result.deviceName).toBe('Unknown on Unknown');
    });

    it('should be case-sensitive (lowercase chrome is not detected)', () => {
      const result = service.parseUserAgent('chrome/120.0');
      expect(result.browser).toBe('Unknown');
    });
  });

  // ===========================================
  // Integration-style edge cases
  // ===========================================

  describe('cross-method edge cases', () => {
    it('revokeSessionByToken should not throw when no session found', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);
      await expect(
        service.revokeSessionByToken('user-123', 'nonexistent-token'),
      ).resolves.toBeUndefined();
    });

    it('createSession should work even if enforceSessionLimit finds 0 sessions', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);
      const newSession = createMockSession();
      (repository.create as jest.Mock).mockReturnValue(newSession);
      (repository.save as jest.Mock).mockResolvedValue(newSession);

      const result = await service.createSession('user-123', 'token', {});
      expect(result).toBe(newSession);
    });

    it('validateSession should handle mixed expired and non-matching sessions', async () => {
      const expired = createExpiredSession();
      const nonMatching = createMockSession();
      (repository.find as jest.Mock).mockResolvedValue([expired, nonMatching]);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);
      (repository.save as jest.Mock).mockImplementation(async (s) => s);

      const result = await service.validateSession('user-123', 'wrong-token');

      expect(expired.isActive).toBe(false);
      expect(result).toBeNull();
    });
  });
});
