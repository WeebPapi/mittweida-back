import { Test, TestingModule } from '@nestjs/testing';
import { PollsService } from './polls.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ActivitiesService } from '../activities/activities.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { Poll } from 'generated/prisma';

describe('PollsService', () => {
  let service: PollsService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let activitiesService: ActivitiesService;

  const mockPoll: Poll = {
    id: 'poll123',
    question: 'Favorite fruit?',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    createdBy: 'user123',
    groupId: 'group123',
  };

  const mockPollOption = {
    id: 'option123',
    text: 'Apple',
    pollId: 'poll123',
    activityId: 'activity123',
    activity: {
      id: 'activity123',
      name: 'Apple Picking',
      description: 'desc',
      address: '123 Main',
      latitude: 1.0,
      longitude: 1.0,
      category: 'Outdoor',
      gallery_images: [],
    },
    votes: [],
  };

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockGroupMember = {
    userId: 'user123',
    groupId: 'group123',
    isAdmin: false,
    joinedAt: new Date(),
    id: 'groupMember123',
  };

  const mockActivity = {
    id: 'activity123',
    name: 'Hiking Trail',
    description: 'A scenic trail',
    address: 'Forest Path',
    latitude: 10,
    longitude: 20,
    videoUrl: null,
    imageUrl: null,
    category: 'Outdoor',
    openHours: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    gallery_images: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollsService,
        {
          provide: PrismaService,
          useValue: {
            poll: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            pollOption: {
              createMany: jest.fn(),
            },
            pollVote: {
              create: jest.fn(),
            },
            groupMember: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn((callback) =>
              callback({
                poll: { create: jest.fn(), findUnique: jest.fn() },
                pollOption: { createMany: jest.fn() },
              }),
            ),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: ActivitiesService,
          useValue: {
            findManyByIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PollsService>(PollsService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
    activitiesService = module.get<ActivitiesService>(ActivitiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a poll if found', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(mockPoll);
      const result = await service.findById(mockPoll.id);
      expect(result).toEqual(mockPoll);
      expect(prismaService.poll.findUnique).toHaveBeenCalledWith({
        where: { id: mockPoll.id },
        include: expect.any(Object),
      });
    });

    it('should return null if poll not found', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException on Prisma error', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockRejectedValue(
        new InternalServerErrorException('Poll not found'),
      );
      let error: any;
      try {
        await service.findById(mockPoll.id);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect(error.message).toBe('Poll not found');
    });
  });

  describe('findMostRecentPollByGroupId', () => {
    it('should return the most recent poll for a group', async () => {
      (prismaService.poll.findFirst as jest.Mock).mockResolvedValue(mockPoll);
      const result = await service.findMostRecentPollByGroupId(
        mockPoll.groupId,
      );
      expect(result).toEqual(mockPoll);
      expect(prismaService.poll.findFirst).toHaveBeenCalledWith({
        where: { groupId: mockPoll.groupId },
        include: expect.any(Object),
        orderBy: { expiresAt: 'desc' },
      });
    });

    it('should return null if no poll found for the group', async () => {
      (prismaService.poll.findFirst as jest.Mock).mockResolvedValue(null);
      const result =
        await service.findMostRecentPollByGroupId('nonexistent-group');
      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException on Prisma error', async () => {
      (prismaService.poll.findFirst as jest.Mock).mockRejectedValue(
        new InternalServerErrorException(
          'Failed to retrieve most recent poll for group.',
        ),
      );
      let error: any;
      try {
        await service.findMostRecentPollByGroupId(mockPoll.groupId);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect(error.message).toBe(
        'Failed to retrieve most recent poll for group.',
      );
    });
  });

  describe('create', () => {
    const createPollDto: CreatePollDto = {
      question: 'New Poll Question',
      groupId: 'group123',
      expiresAt: new Date(Date.now() + 7200000),
      selectedActivityIds: ['activity123'],
    };

    it('should successfully create a poll and its options', async () => {
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue(
        mockGroupMember,
      );
      (activitiesService.findManyByIds as jest.Mock).mockResolvedValue([
        mockActivity,
      ]);

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const prismaTx = {
            poll: {
              create: jest.fn().mockResolvedValue(mockPoll),
              findUnique: jest.fn().mockResolvedValue({
                ...mockPoll,
                options: [{ ...mockPollOption, activity: mockActivity }],
              }),
            },
            pollOption: {
              createMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
          };
          return callback(prismaTx);
        },
      );

      const result = await service.create(createPollDto, mockUser.id);

      expect(prismaService.groupMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_groupId: {
            userId: mockUser.id,
            groupId: createPollDto.groupId,
          },
        },
      });
      expect(activitiesService.findManyByIds).toHaveBeenCalledWith(
        createPollDto.selectedActivityIds,
      );
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockPoll,
        options: [{ ...mockPollOption, activity: mockActivity }],
      });
    });

    it('should throw ForbiddenException if user is not a group member', async () => {
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      await expect(
        service.create(createPollDto, 'non-member-id'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create(createPollDto, 'non-member-id'),
      ).rejects.toThrow('You are not a member of this group.');
    });

    it('should handle empty selectedActivityIds gracefully (though validation should prevent this)', async () => {
      const dtoWithEmptyActivities = {
        ...createPollDto,
        selectedActivityIds: [],
      };
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue(
        mockGroupMember,
      );
      (activitiesService.findManyByIds as jest.Mock).mockResolvedValue([]);

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const prismaTx = {
            poll: {
              create: jest.fn().mockResolvedValue(mockPoll),
              findUnique: jest
                .fn()
                .mockResolvedValue({ ...mockPoll, options: [] }),
            },
            pollOption: {
              createMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          };
          return callback(prismaTx);
        },
      );

      const result = await service.create(dtoWithEmptyActivities, mockUser.id);
      expect(activitiesService.findManyByIds).toHaveBeenCalledWith([]);
      expect(result?.options).toEqual([]);
    });

    it('should throw InternalServerErrorException on transaction failure', async () => {
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue(
        mockGroupMember,
      );
      (activitiesService.findManyByIds as jest.Mock).mockResolvedValue([
        mockActivity,
      ]);
      (prismaService.$transaction as jest.Mock).mockRejectedValue(
        new InternalServerErrorException(
          'Failed to create poll due to a server error.',
        ),
      );

      await expect(service.create(createPollDto, mockUser.id)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.create(createPollDto, mockUser.id)).rejects.toThrow(
        'Failed to create poll due to a server error.',
      );
    });
  });

  describe('voteOnPoll', () => {
    const validPollOptionId = mockPollOption.id;
    const expiredPollId = 'expiredPoll123';

    beforeEach(() => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.poll.findUnique as jest.Mock).mockImplementation(
        (params) => {
          if (params.where.id === mockPoll.id) {
            return Promise.resolve({
              ...mockPoll,
              options: [{ id: validPollOptionId }],
              group: { id: mockPoll.groupId },
            });
          }
          if (params.where.id === expiredPollId) {
            return Promise.resolve({
              ...mockPoll,
              id: expiredPollId,
              expiresAt: new Date(Date.now() - 3600000),
              options: [{ id: validPollOptionId }],
              group: { id: mockPoll.groupId },
            });
          }
          return Promise.resolve(null);
        },
      );
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue(
        mockGroupMember,
      );
      (prismaService.pollVote.create as jest.Mock).mockResolvedValue({
        id: 'vote123',
        pollId: mockPoll.id,
        pollOptionId: validPollOptionId,
        userId: mockUser.id,
        createdAt: new Date(),
      });
    });

    it('should successfully record a vote', async () => {
      const result = await service.voteOnPoll(
        mockPoll.id,
        validPollOptionId,
        mockUser.id,
      );
      expect(result).toEqual({ message: 'Successfully voted' });
      expect(prismaService.pollVote.create).toHaveBeenCalledWith({
        data: {
          pollId: mockPoll.id,
          pollOptionId: validPollOptionId,
          userId: mockUser.id,
        },
      });
    });

    it('should throw NotFoundException if poll not found', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.voteOnPoll('nonexistent-poll', validPollOptionId, mockUser.id),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.voteOnPoll('nonexistent-poll', validPollOptionId, mockUser.id),
      ).rejects.toThrow('The poll, option or user was not found');
    });

    it('should throw NotFoundException if user not found', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(null);
      await expect(
        service.voteOnPoll(mockPoll.id, validPollOptionId, 'nonexistent-user'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.voteOnPoll(mockPoll.id, validPollOptionId, 'nonexistent-user'),
      ).rejects.toThrow('The poll, option or user was not found');
    });

    it('should throw BadRequestException if poll has expired', async () => {
      await expect(
        service.voteOnPoll(expiredPollId, validPollOptionId, mockUser.id),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.voteOnPoll(expiredPollId, validPollOptionId, mockUser.id),
      ).rejects.toThrow('This poll has already expired.');
    });

    it('should throw BadRequestException if poll option does not belong to poll', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue({
        ...mockPoll,
        options: [],
        group: { id: mockPoll.groupId },
      });
      await expect(
        service.voteOnPoll(mockPoll.id, 'wrong-option-id', mockUser.id),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.voteOnPoll(mockPoll.id, 'wrong-option-id', mockUser.id),
      ).rejects.toThrow(
        `Poll option with ID "wrong-option-id" does not belong to poll "${mockPoll.id}".`,
      );
    });

    it('should throw ForbiddenException if user is not a group member', async () => {
      (prismaService.groupMember.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      await expect(
        service.voteOnPoll(
          mockPoll.id,
          validPollOptionId,
          'non-member-user-id',
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.voteOnPoll(
          mockPoll.id,
          validPollOptionId,
          'non-member-user-id',
        ),
      ).rejects.toThrow(
        'You must be a member of this group to vote on this poll.',
      );
    });
  });

  describe('update', () => {
    const updatePollDto: UpdatePollDto = {
      question: 'Updated Poll Question',
    };

    it('should successfully update a poll', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(mockPoll);
      (prismaService.poll.update as jest.Mock).mockResolvedValue({
        ...mockPoll,
        ...updatePollDto,
      });

      const result = await service.update(mockPoll.id, updatePollDto);
      expect(result).toEqual({ ...mockPoll, ...updatePollDto });
      expect(prismaService.poll.update).toHaveBeenCalledWith({
        where: { id: mockPoll.id },
        data: updatePollDto,
      });
    });

    it('should throw NotFoundException if poll not found', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.update('nonexistent-id', updatePollDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('nonexistent-id', updatePollDto),
      ).rejects.toThrow('Poll not found');
    });

    it('should throw InternalServerErrorException on Prisma error', async () => {
      (prismaService.poll.findUnique as jest.Mock).mockResolvedValue(mockPoll);

      (prismaService.poll.update as jest.Mock).mockRejectedValue(
        new InternalServerErrorException('Error updating poll'),
      );
      let error: any;
      try {
        await service.update(mockPoll.id, updatePollDto);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect(error.message).toBe('Error updating poll');
    });
  });

  describe('delete', () => {
    it('should successfully delete a poll', async () => {
      (prismaService.poll.delete as jest.Mock).mockResolvedValue(mockPoll);
      const result = await service.delete(mockPoll.id);
      expect(result).toEqual(mockPoll);
      expect(prismaService.poll.delete).toHaveBeenCalledWith({
        where: { id: mockPoll.id },
      });
    });

    it('should throw an error if poll not found (Prisma behavior)', async () => {
      (prismaService.poll.delete as jest.Mock).mockRejectedValue(
        new Error('P2025: Record not found'),
      );
      await expect(service.delete('nonexistent-id')).rejects.toThrow(
        'P2025: Record not found',
      );
    });
  });
});
