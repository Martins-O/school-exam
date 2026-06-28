import { NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: any;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const user = { id: 'u1', name: 'Test', email: 'test@test.com' };
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findById('u1');
      expect(result.id).toBe('u1');
    });

    it('throws NotFoundException when not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      const user = { id: 'u1', email: 'test@test.com' };
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@test.com');
      expect(result.id).toBe('u1');
    });

    it('returns null when not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@test.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a user with hashed password', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$12$hashed');

      const createdUser = {
        id: 'u1',
        name: 'John',
        email: 'john@test.com',
        password: '$2b$12$hashed',
        role: 'student',
        createdById: 'admin-1',
      };
      userRepo.create.mockReturnValue(createdUser);
      userRepo.save.mockResolvedValue(createdUser);

      const result = await service.create({
        name: 'John',
        email: 'john@test.com',
        password: 'plaintext',
        role: 'student',
        createdById: 'admin-1',
      });

      expect(result.email).toBe('john@test.com');
      expect(result.role).toBe('student');
      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 12);
    });

    it('defaults role to student', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$12$hashed');

      const createdUser = { id: 'u1', name: 'John', email: 'john@test.com', password: 'hash', role: 'student' };
      userRepo.create.mockReturnValue(createdUser);
      userRepo.save.mockResolvedValue(createdUser);

      const result = await service.create({
        name: 'John',
        email: 'john@test.com',
        password: 'plaintext',
      });

      expect(result.role).toBe('student');
    });

    it('throws ConflictException for duplicate email', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'existing', email: 'dup@test.com' });

      await expect(
        service.create({ name: 'Dup', email: 'dup@test.com', password: 'pass1234' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createByAdmin', () => {
    it('sets createdById', async () => {
      const spy = jest.spyOn(service, 'create').mockResolvedValue({ id: 'u1' } as any);

      await service.createByAdmin('admin-1', {
        name: 'New',
        email: 'new@test.com',
        password: 'pass1234',
        role: 'teacher',
      });

      expect(spy).toHaveBeenCalledWith({
        name: 'New',
        email: 'new@test.com',
        password: 'pass1234',
        role: 'teacher',
        createdById: 'admin-1',
      });
    });
  });

  describe('findAll', () => {
    it('returns all users without role filter', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]),
      };
      userRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(qb.where).not.toHaveBeenCalled();
    });

    it('filters by role when provided', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'u1', role: 'teacher' }]),
      };
      userRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('teacher');
      expect(result).toHaveLength(1);
      expect(qb.where).toHaveBeenCalledWith('user.role = :role', { role: 'teacher' });
    });
  });

  describe('update', () => {
    it('updates name and email', async () => {
      const user = { id: 'u1', name: 'Old', email: 'old@test.com', isActive: true };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation(e => Promise.resolve(e));

      const result = await service.update('u1', { name: 'New', email: 'new@test.com' });
      expect(result.name).toBe('New');
      expect(result.email).toBe('new@test.com');
    });

    it('throws ConflictException when email taken by another user', async () => {
      const user = { id: 'u1', name: 'Me', email: 'me@test.com' };
      userRepo.findOne.mockResolvedValueOnce(user) // findById
        .mockResolvedValueOnce({ id: 'u2', email: 'taken@test.com' }); // findByEmail

      await expect(
        service.update('u1', { email: 'taken@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('allows keeping same email', async () => {
      const user = { id: 'u1', name: 'Me', email: 'me@test.com' };
      userRepo.findOne.mockResolvedValueOnce(user) // findById
        .mockResolvedValueOnce(user); // findByEmail returns same user
      userRepo.save.mockImplementation(e => Promise.resolve(e));

      const result = await service.update('u1', { email: 'me@test.com' });
      expect(result.email).toBe('me@test.com');
    });

    it('deactivates user with isActive', async () => {
      const user = { id: 'u1', name: 'Me', email: 'me@test.com', isActive: true };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation(e => Promise.resolve(e));

      const result = await service.update('u1', { isActive: false });
      expect(result.isActive).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('sets isActive to false', async () => {
      const spy = jest.spyOn(service, 'update').mockResolvedValue({} as any);

      await service.softDelete('u1');
      expect(spy).toHaveBeenCalledWith('u1', { isActive: false });
    });
  });
});
