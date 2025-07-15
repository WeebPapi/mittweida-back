import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import {
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';

describe('GroupsService', () => {
  let service: GroupsService;
  let prismaService: PrismaService;
  let usersService: UsersService;

  const mockGroup = {
    id: 'group123',
    name: 'Test Group',
    code: 'ABCDEF',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGroupMember = {
    id: 'member123',
    userId: mockUser.id,
    groupId: mockGroup.id,
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: PrismaService,
          useValue: {
            group: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            groupMember: {
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);

    jest.spyOn(service as any, 'generateCode').mockResolvedValue('NEWCODE');

    jest
      .spyOn(service as any, 'instantiateGroupMember')
      .mockResolvedValue(mockGroupMember);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a group and instantiate an admin member', async () => {
      const createGroupDto = { name: 'New Group' };
      (prismaService.group.create as jest.Mock).mockResolvedValue(mockGroup);
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.create(createGroupDto, mockUser.id);

      expect(prismaService.group.create).toHaveBeenCalledWith({
        data: { ...createGroupDto, code: 'NEWCODE' },
      });
      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(service['instantiateGroupMember']).toHaveBeenCalledWith(
        mockUser,
        mockGroup,
        true,
      );
      expect(result).toEqual(mockGroup);
    });

    it('should throw ConflictException if group code already exists (P2002)', async () => {
      const createGroupDto = { name: 'Existing Group' };
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`code`)',
        { code: 'P2002', clientVersion: 'test' },
      );
      (prismaService.group.create as jest.Mock).mockRejectedValue(prismaError);

      await expect(service.create(createGroupDto, mockUser.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw InternalServerErrorException for other creation errors', async () => {
      const createGroupDto = { name: 'Error Group' };
      (prismaService.group.create as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.create(createGroupDto, mockUser.id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findGroup', () => {
    it('should return a group if found', async () => {
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(
        mockGroup,
      );
      const result = await service.findGroup(mockGroup.id);
      expect(result).toEqual(mockGroup);
      expect(prismaService.group.findUnique).toHaveBeenCalledWith({
        where: { id: mockGroup.id },
        include: {
          members: {},
          photos: {},
          polls: {},
        },
      });
    });

    it('should return null if group not found', async () => {
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.findGroup('nonExistentId');
      expect(result).toBeNull();
    });
  });

  describe('updateGroup', () => {
    const updateGroupDto = { name: 'Updated Group Name' };

    it('should successfully update a group', async () => {
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(
        mockGroup,
      );
      (prismaService.group.update as jest.Mock).mockResolvedValue({
        ...mockGroup,
        ...updateGroupDto,
      });

      const result = await service.updateGroup(mockGroup.id, updateGroupDto);

      expect(prismaService.group.findUnique).toHaveBeenCalledWith({
        where: { id: mockGroup.id },
      });
      expect(prismaService.group.update).toHaveBeenCalledWith({
        where: { id: mockGroup.id },
        data: updateGroupDto,
      });
      expect(result).toEqual({ ...mockGroup, ...updateGroupDto });
    });

    it('should throw NotFoundException if group to update does not exist', async () => {
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateGroup('nonExistentId', updateGroupDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for other update errors', async () => {
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(
        mockGroup,
      );

      (prismaService.group.update as jest.Mock).mockRejectedValue(
        new Error('Simulated database error'),
      );

      let caughtError: any;
      try {
        await service.updateGroup(mockGroup.id, updateGroupDto);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(InternalServerErrorException);
      expect(caughtError.message).toBe('Failed to update group');
    });
  });

  describe('join', () => {
    it('should successfully join a group', async () => {
      const groupWithNoMembers = { ...mockGroup, members: [] };
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(
        groupWithNoMembers,
      );
      (service as any).instantiateGroupMember.mockResolvedValue(
        mockGroupMember,
      );

      const result = await service.join({ id: mockUser.id }, mockGroup.code);

      expect(prismaService.group.findUnique).toHaveBeenCalledWith({
        where: { code: mockGroup.code },
        include: { members: true },
      });
      expect(service['instantiateGroupMember']).toHaveBeenCalledWith(
        { id: mockUser.id },
        groupWithNoMembers,
        false,
      );
      expect(result).toEqual(mockGroupMember);
    });

    it('should throw NotFoundException if group to join does not exist', async () => {
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.join({ id: mockUser.id }, 'INVALIDCODE'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user is already a member', async () => {
      const groupWithMember = {
        ...mockGroup,
        members: [{ userId: mockUser.id }],
      };
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(
        groupWithMember,
      );

      await expect(
        service.join({ id: mockUser.id }, mockGroup.code),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('leave', () => {
    it('should successfully leave a group', async () => {
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue(
        mockGroupMember,
      );
      (prismaService.groupMember.delete as jest.Mock).mockResolvedValue(
        mockGroupMember,
      );

      const result = await service.leave(mockUser.id, mockGroup.id);

      expect(prismaService.groupMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_groupId: { userId: mockUser.id, groupId: mockGroup.id },
        },
      });
      expect(prismaService.groupMember.delete).toHaveBeenCalledWith({
        where: {
          userId_groupId: { userId: mockUser.id, groupId: mockGroup.id },
        },
      });
      expect(result).toEqual({ message: 'Successfully left group' });
    });

    it('should throw NotFoundException if member not found', async () => {
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.leave(mockUser.id, mockGroup.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException for other leave errors', async () => {
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue(
        mockGroupMember,
      );
      (prismaService.groupMember.delete as jest.Mock).mockRejectedValue(
        new Error('Database delete error'),
      );

      await expect(service.leave(mockUser.id, mockGroup.id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete a group', async () => {
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(
        mockGroup,
      );
      (prismaService.group.delete as jest.Mock).mockResolvedValue(mockGroup);

      const result = await service.delete(mockGroup.id);

      expect(prismaService.group.findUnique).toHaveBeenCalledWith({
        where: { id: mockGroup.id },
      });
      expect(prismaService.group.delete).toHaveBeenCalledWith({
        where: { id: mockGroup.id },
      });
      expect(result).toEqual(mockGroup);
    });

    it('should throw NotFoundException if group to delete does not exist', async () => {
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.delete('nonExistentId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException for other delete errors', async () => {
      (prismaService.group.findUnique as jest.Mock).mockResolvedValue(
        mockGroup,
      );
      (prismaService.group.delete as jest.Mock).mockRejectedValue(
        new Error('Database delete error'),
      );

      await expect(service.delete(mockGroup.id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
