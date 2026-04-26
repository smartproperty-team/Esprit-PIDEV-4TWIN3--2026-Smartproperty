import { describe, it, expect } from 'vitest';
import { UserRole } from '@/types/auth';
import type { User } from '@/types/auth';
import {
  canManageProperties,
  canCreateProperties,
  isTenant,
  isPlatformAdmin,
  isAdmin,
  canAccessAdminUsers,
  canReviewVerifications,
  canReviewApplications,
  canAccessLeases,
  canManageLeases,
  canCreateMaintenanceRequest,
  canTrackMaintenanceRequests,
  canManageAssignedMaintenance,
  canManageAgencyOnboarding,
  canManageFavorites,
  canModerateReviews,
  isOwner,
  isManager,
} from '../permissions';

const makeUser = (role: UserRole): User =>
  ({ role } as User);

describe('permissions', () => {
  describe('canManageProperties', () => {
    it('returns true for SUPER_ADMIN', () => {
      expect(canManageProperties(makeUser(UserRole.SUPER_ADMIN))).toBe(true);
    });

    it('returns true for OWNER', () => {
      expect(canManageProperties(makeUser(UserRole.OWNER))).toBe(true);
    });

    it('returns true for BRANCH_MANAGER', () => {
      expect(canManageProperties(makeUser(UserRole.BRANCH_MANAGER))).toBe(true);
    });

    it('returns true for REAL_ESTATE_AGENT', () => {
      expect(canManageProperties(makeUser(UserRole.REAL_ESTATE_AGENT))).toBe(true);
    });

    it('returns true for RENTAL_MANAGER', () => {
      expect(canManageProperties(makeUser(UserRole.RENTAL_MANAGER))).toBe(true);
    });

    it('returns false for TENANT', () => {
      expect(canManageProperties(makeUser(UserRole.TENANT))).toBe(false);
    });

    it('returns false for null user', () => {
      expect(canManageProperties(null)).toBe(false);
    });

    it('returns false for undefined user', () => {
      expect(canManageProperties(undefined)).toBe(false);
    });
  });

  describe('canCreateProperties', () => {
    it('returns true for SUPER_ADMIN', () => {
      expect(canCreateProperties(makeUser(UserRole.SUPER_ADMIN))).toBe(true);
    });

    it('returns true for OWNER', () => {
      expect(canCreateProperties(makeUser(UserRole.OWNER))).toBe(true);
    });

    it('returns true for REAL_ESTATE_AGENT', () => {
      expect(canCreateProperties(makeUser(UserRole.REAL_ESTATE_AGENT))).toBe(true);
    });

    it('returns false for TENANT', () => {
      expect(canCreateProperties(makeUser(UserRole.TENANT))).toBe(false);
    });

    it('returns false for BRANCH_MANAGER', () => {
      expect(canCreateProperties(makeUser(UserRole.BRANCH_MANAGER))).toBe(false);
    });
  });

  describe('isTenant', () => {
    it('returns true for TENANT', () => {
      expect(isTenant(makeUser(UserRole.TENANT))).toBe(true);
    });

    it('returns false for OWNER', () => {
      expect(isTenant(makeUser(UserRole.OWNER))).toBe(false);
    });

    it('returns false for null', () => {
      expect(isTenant(null)).toBe(false);
    });
  });

  describe('isPlatformAdmin / isAdmin', () => {
    it('returns true for SUPER_ADMIN', () => {
      expect(isPlatformAdmin(makeUser(UserRole.SUPER_ADMIN))).toBe(true);
    });

    it('returns false for OWNER', () => {
      expect(isPlatformAdmin(makeUser(UserRole.OWNER))).toBe(false);
    });

    it('isAdmin is an alias for isPlatformAdmin', () => {
      expect(isAdmin(makeUser(UserRole.SUPER_ADMIN))).toBe(true);
      expect(isAdmin(makeUser(UserRole.TENANT))).toBe(false);
    });
  });

  describe('canAccessAdminUsers', () => {
    it('returns true for SUPER_ADMIN', () => {
      expect(canAccessAdminUsers(makeUser(UserRole.SUPER_ADMIN))).toBe(true);
    });

    it('returns false for BRANCH_MANAGER', () => {
      expect(canAccessAdminUsers(makeUser(UserRole.BRANCH_MANAGER))).toBe(false);
    });
  });

  describe('canReviewVerifications', () => {
    it('returns true for SUPER_ADMIN', () => {
      expect(canReviewVerifications(makeUser(UserRole.SUPER_ADMIN))).toBe(true);
    });

    it('returns true for BRANCH_MANAGER', () => {
      expect(canReviewVerifications(makeUser(UserRole.BRANCH_MANAGER))).toBe(true);
    });

    it('returns false for TENANT', () => {
      expect(canReviewVerifications(makeUser(UserRole.TENANT))).toBe(false);
    });
  });

  describe('canReviewApplications', () => {
    it('returns true for SUPER_ADMIN', () => {
      expect(canReviewApplications(makeUser(UserRole.SUPER_ADMIN))).toBe(true);
    });

    it('returns true for RENTAL_MANAGER', () => {
      expect(canReviewApplications(makeUser(UserRole.RENTAL_MANAGER))).toBe(true);
    });

    it('returns false for TENANT', () => {
      expect(canReviewApplications(makeUser(UserRole.TENANT))).toBe(false);
    });
  });

  describe('canAccessLeases', () => {
    it('returns true for TENANT', () => {
      expect(canAccessLeases(makeUser(UserRole.TENANT))).toBe(true);
    });

    it('returns true for OWNER', () => {
      expect(canAccessLeases(makeUser(UserRole.OWNER))).toBe(true);
    });

    it('returns false for SERVICE_PROVIDER', () => {
      expect(canAccessLeases(makeUser(UserRole.SERVICE_PROVIDER))).toBe(false);
    });
  });

  describe('canManageLeases', () => {
    it('returns true for OWNER', () => {
      expect(canManageLeases(makeUser(UserRole.OWNER))).toBe(true);
    });

    it('returns false for TENANT', () => {
      expect(canManageLeases(makeUser(UserRole.TENANT))).toBe(false);
    });
  });

  describe('maintenance permissions', () => {
    it('canCreateMaintenanceRequest - OWNER can', () => {
      expect(canCreateMaintenanceRequest(makeUser(UserRole.OWNER))).toBe(true);
    });

    it('canCreateMaintenanceRequest - TENANT cannot', () => {
      expect(canCreateMaintenanceRequest(makeUser(UserRole.TENANT))).toBe(false);
    });

    it('canTrackMaintenanceRequests - BRANCH_MANAGER can', () => {
      expect(canTrackMaintenanceRequests(makeUser(UserRole.BRANCH_MANAGER))).toBe(true);
    });

    it('canManageAssignedMaintenance - SERVICE_PROVIDER can', () => {
      expect(canManageAssignedMaintenance(makeUser(UserRole.SERVICE_PROVIDER))).toBe(true);
    });

    it('canManageAssignedMaintenance - OWNER cannot', () => {
      expect(canManageAssignedMaintenance(makeUser(UserRole.OWNER))).toBe(false);
    });
  });

  describe('canManageAgencyOnboarding', () => {
    it('returns true for BRANCH_MANAGER', () => {
      expect(canManageAgencyOnboarding(makeUser(UserRole.BRANCH_MANAGER))).toBe(true);
    });

    it('returns false for SUPER_ADMIN', () => {
      expect(canManageAgencyOnboarding(makeUser(UserRole.SUPER_ADMIN))).toBe(false);
    });
  });

  describe('canManageFavorites', () => {
    it('returns true for TENANT', () => {
      expect(canManageFavorites(makeUser(UserRole.TENANT))).toBe(true);
    });

    it('returns false for OWNER', () => {
      expect(canManageFavorites(makeUser(UserRole.OWNER))).toBe(false);
    });
  });

  describe('canModerateReviews', () => {
    it('returns true for SUPER_ADMIN', () => {
      expect(canModerateReviews(makeUser(UserRole.SUPER_ADMIN))).toBe(true);
    });

    it('returns true for OWNER', () => {
      expect(canModerateReviews(makeUser(UserRole.OWNER))).toBe(true);
    });

    it('returns false for TENANT', () => {
      expect(canModerateReviews(makeUser(UserRole.TENANT))).toBe(false);
    });
  });

  describe('isOwner', () => {
    it('returns true for OWNER', () => {
      expect(isOwner(makeUser(UserRole.OWNER))).toBe(true);
    });

    it('returns false for TENANT', () => {
      expect(isOwner(makeUser(UserRole.TENANT))).toBe(false);
    });

    it('returns false for null', () => {
      expect(isOwner(null)).toBe(false);
    });
  });

  describe('isManager', () => {
    it('returns true for REAL_ESTATE_AGENT', () => {
      expect(isManager(makeUser(UserRole.REAL_ESTATE_AGENT))).toBe(true);
    });

    it('returns true for BRANCH_MANAGER', () => {
      expect(isManager(makeUser(UserRole.BRANCH_MANAGER))).toBe(true);
    });

    it('returns true for RENTAL_MANAGER', () => {
      expect(isManager(makeUser(UserRole.RENTAL_MANAGER))).toBe(true);
    });

    it('returns false for OWNER', () => {
      expect(isManager(makeUser(UserRole.OWNER))).toBe(false);
    });

    it('returns false for TENANT', () => {
      expect(isManager(makeUser(UserRole.TENANT))).toBe(false);
    });
  });
});
