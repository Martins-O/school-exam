import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockContext: any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createContext(role?: string) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { role } : undefined,
        }),
      }),
    } as any;
  }

  describe('no @Roles decorator', () => {
    it('allows access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      expect(guard.canActivate(createContext('student'))).toBe(true);
    });
  });

  describe('with @Roles decorator', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['super_admin', 'administrator']);
    });

    it('allows access when user has a matching role', () => {
      expect(guard.canActivate(createContext('administrator'))).toBe(true);
    });

    it('allows super_admin through admin-only route', () => {
      expect(guard.canActivate(createContext('super_admin'))).toBe(true);
    });

    it('throws ForbiddenException when user role does not match', () => {
      expect(() => guard.canActivate(createContext('student'))).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when no user on request', () => {
      expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for teacher on admin-only route', () => {
      expect(() => guard.canActivate(createContext('teacher'))).toThrow(ForbiddenException);
    });
  });

  describe('teacher-only route', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['teacher', 'super_admin', 'administrator']);
    });

    it('allows teacher', () => {
      expect(guard.canActivate(createContext('teacher'))).toBe(true);
    });

    it('rejects student', () => {
      expect(() => guard.canActivate(createContext('student'))).toThrow(ForbiddenException);
    });

    it('rejects parent', () => {
      expect(() => guard.canActivate(createContext('parent'))).toThrow(ForbiddenException);
    });
  });
});
