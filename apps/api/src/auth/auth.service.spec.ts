import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@test.com',
    password: '$2b$12$hashvalue',
    role: 'student',
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
    } as any;

    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    } as any;

    service = new AuthService(usersService as any, jwtService as any);
  });

  describe('validateUser', () => {
    it('returns user for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password123');
      expect(result).toEqual(mockUser);
    });

    it('throws UnauthorizedException for unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('unknown@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        service.validateUser('test@test.com', 'wrongpass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('returns accessToken and user', async () => {
      const result = await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@test.com',
        role: 'student',
      });
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).toEqual({
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'student',
      });
    });
  });
});
