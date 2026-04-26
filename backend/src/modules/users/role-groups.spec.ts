import { UserRole } from './entities/user.entity';
import {
  PLATFORM_ADMIN_ROLES,
  TENANT_ONLY_ROLES,
  PROPERTY_CREATOR_ROLES,
  PROPERTY_MANAGEMENT_ROLES,
  STORAGE_FILE_DELETE_ROLES,
  VERIFICATION_REVIEW_ROLES,
  APPLICATION_REVIEW_ROLES,
  LEASE_MANAGEMENT_ROLES,
  LEASE_PARTICIPANT_ROLES,
  FAVORITES_ROLES,
  REVIEW_AUTHOR_ROLES,
  REVIEW_MODERATION_ROLES,
  SELF_REGISTRABLE_ROLES,
  DEFAULT_REGISTRATION_ROLE,
  hasPlatformAdminRole,
} from './role-groups';

describe('role-groups', () => {
  describe('role arrays', () => {
    it('PLATFORM_ADMIN_ROLES contains only SUPER_ADMIN', () => {
      expect(PLATFORM_ADMIN_ROLES).toEqual([UserRole.SUPER_ADMIN]);
    });

    it('TENANT_ONLY_ROLES contains only TENANT', () => {
      expect(TENANT_ONLY_ROLES).toEqual([UserRole.TENANT]);
    });

    it('PROPERTY_CREATOR_ROLES includes OWNER and SUPER_ADMIN', () => {
      expect(PROPERTY_CREATOR_ROLES).toContain(UserRole.OWNER);
      expect(PROPERTY_CREATOR_ROLES).toContain(UserRole.SUPER_ADMIN);
    });

    it('PROPERTY_MANAGEMENT_ROLES includes management roles', () => {
      expect(PROPERTY_MANAGEMENT_ROLES).toContain(UserRole.OWNER);
      expect(PROPERTY_MANAGEMENT_ROLES).toContain(UserRole.BRANCH_MANAGER);
      expect(PROPERTY_MANAGEMENT_ROLES).toContain(UserRole.REAL_ESTATE_AGENT);
      expect(PROPERTY_MANAGEMENT_ROLES).toContain(UserRole.RENTAL_MANAGER);
      expect(PROPERTY_MANAGEMENT_ROLES).toContain(UserRole.SUPER_ADMIN);
    });

    it('PROPERTY_MANAGEMENT_ROLES excludes TENANT', () => {
      expect(PROPERTY_MANAGEMENT_ROLES).not.toContain(UserRole.TENANT);
    });

    it('STORAGE_FILE_DELETE_ROLES matches property management roles', () => {
      expect(STORAGE_FILE_DELETE_ROLES).toEqual(
        expect.arrayContaining(PROPERTY_MANAGEMENT_ROLES),
      );
    });

    it('VERIFICATION_REVIEW_ROLES includes BRANCH_MANAGER and SUPER_ADMIN', () => {
      expect(VERIFICATION_REVIEW_ROLES).toContain(UserRole.BRANCH_MANAGER);
      expect(VERIFICATION_REVIEW_ROLES).toContain(UserRole.SUPER_ADMIN);
      expect(VERIFICATION_REVIEW_ROLES).not.toContain(UserRole.TENANT);
    });

    it('APPLICATION_REVIEW_ROLES includes expected roles', () => {
      expect(APPLICATION_REVIEW_ROLES).toContain(UserRole.BRANCH_MANAGER);
      expect(APPLICATION_REVIEW_ROLES).toContain(UserRole.REAL_ESTATE_AGENT);
      expect(APPLICATION_REVIEW_ROLES).toContain(UserRole.RENTAL_MANAGER);
      expect(APPLICATION_REVIEW_ROLES).toContain(UserRole.SUPER_ADMIN);
    });

    it('LEASE_MANAGEMENT_ROLES does not include TENANT', () => {
      expect(LEASE_MANAGEMENT_ROLES).not.toContain(UserRole.TENANT);
    });

    it('LEASE_PARTICIPANT_ROLES includes TENANT plus management roles', () => {
      expect(LEASE_PARTICIPANT_ROLES).toContain(UserRole.TENANT);
      expect(LEASE_PARTICIPANT_ROLES).toContain(UserRole.OWNER);
      expect(LEASE_PARTICIPANT_ROLES).toContain(UserRole.SUPER_ADMIN);
    });

    it('FAVORITES_ROLES is tenant-only', () => {
      expect(FAVORITES_ROLES).toEqual([UserRole.TENANT]);
    });

    it('REVIEW_AUTHOR_ROLES is tenant-only', () => {
      expect(REVIEW_AUTHOR_ROLES).toEqual([UserRole.TENANT]);
    });

    it('REVIEW_MODERATION_ROLES includes OWNER', () => {
      expect(REVIEW_MODERATION_ROLES).toContain(UserRole.OWNER);
    });

    it('SELF_REGISTRABLE_ROLES includes expected roles', () => {
      expect(SELF_REGISTRABLE_ROLES).toContain(UserRole.TENANT);
      expect(SELF_REGISTRABLE_ROLES).toContain(UserRole.OWNER);
      expect(SELF_REGISTRABLE_ROLES).toContain(UserRole.REAL_ESTATE_AGENT);
      expect(SELF_REGISTRABLE_ROLES).toContain(UserRole.SERVICE_PROVIDER);
      expect(SELF_REGISTRABLE_ROLES).not.toContain(UserRole.SUPER_ADMIN);
    });

    it('DEFAULT_REGISTRATION_ROLE is TENANT', () => {
      expect(DEFAULT_REGISTRATION_ROLE).toBe(UserRole.TENANT);
    });
  });

  describe('hasPlatformAdminRole', () => {
    it('returns true for SUPER_ADMIN', () => {
      expect(hasPlatformAdminRole(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('returns false for OWNER', () => {
      expect(hasPlatformAdminRole(UserRole.OWNER)).toBe(false);
    });

    it('returns false for TENANT', () => {
      expect(hasPlatformAdminRole(UserRole.TENANT)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(hasPlatformAdminRole(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(hasPlatformAdminRole('' as UserRole)).toBe(false);
    });
  });
});
