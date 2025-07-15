import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, User } from '../../generated/prisma';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    profilePicture: null,
    role: 'USER',
    refresh_token: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.spyOn(service, 'findById').mockImplementation((id: string) => {
      if (id === mockUser.id) {
        return Promise.resolve(mockUser);
      }

      return mockPrismaService.user
        .findUnique({
          where: { id },
          include: { groups: {}, photos: {}, polls: {}, pollVotes: {} },
        })
        .then((user) => {
          if (!user) {
            throw new NotFoundException('User with ID not found');
          }
          return user;
        });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const createUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };
      const result = await service.create(createUserDto);
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
    });

    it('should throw ConflictException if email already in use (P2002)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        { code: 'P2002', clientVersion: 'test' },
      );
      mockPrismaService.user.create.mockRejectedValue(prismaError);

      const createUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Email already in use',
      );
    });

    it('should throw InternalServerErrorException for other creation errors', async () => {
      mockPrismaService.user.create.mockRejectedValue(new Error('DB error'));

      const createUserDto = {
        email: 'error@example.com',
        password: 'password123',
        firstName: 'Error',
        lastName: 'User',
      };
      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Failed to create user',
      );
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
      jest.spyOn(service, 'findById').mockRestore();
    });

    it('should return a user if found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: { groups: {}, photos: {}, polls: {}, pollVotes: {} },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('non-existent-id')).rejects.toThrow(
        'User with ID not found',
      );
    });

    it('should throw NotFoundException if a database error occurs during findById', async () => {
      mockPrismaService.user.findUnique.mockRejectedValue(
        new Error('DB connection error'),
      );

      await expect(service.findById('some-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('some-id')).rejects.toThrow(
        'User with ID not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });

    it('should return null if user not found by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateDto = { firstName: 'Updated' };
    const updatedUser = { ...mockUser, ...updateDto };

    it('should successfully update a user', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateDto);
      expect(result).toEqual({
        message: 'Successfully Updated',
        id: mockUser.id,
      });
      expect(service.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateDto,
      });
    });

    it('should throw NotFoundException if user to update not found', async () => {
      jest
        .spyOn(service, 'findById')
        .mockRejectedValueOnce(new NotFoundException('User with ID not found'));

      await expect(
        service.update('non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent-id', updateDto),
      ).rejects.toThrow('User with ID not found');
      expect(service.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should throw ConflictException if email already in use during update (P2002)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        { code: 'P2002', clientVersion: 'test' },
      );
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockRejectedValue(prismaError);

      const updateEmailDto = { email: 'another-existing@example.com' };
      await expect(service.update(mockUser.id, updateEmailDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(mockUser.id, updateEmailDto)).rejects.toThrow(
        'Email already in use',
      );
      expect(service.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw InternalServerErrorException for other update errors', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockRejectedValue(
        new Error('DB update error'),
      );

      await expect(service.update(mockUser.id, updateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.update(mockUser.id, updateDto)).rejects.toThrow(
        'Failed to update user',
      );
      expect(service.findById).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('delete', () => {
    it('should successfully delete a user', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.delete(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(service.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException if user to delete not found', async () => {
      jest
        .spyOn(service, 'findById')
        .mockRejectedValueOnce(new NotFoundException('User with ID not found'));

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.delete('non-existent-id')).rejects.toThrow(
        'User with ID not found',
      );
      expect(service.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });
});
