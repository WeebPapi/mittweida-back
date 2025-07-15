import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityDto } from './dto/activity.dto';

const mockPrismaService = {
  activity: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    prisma = module.get<PrismaService>(PrismaService);

    for (const key in mockPrismaService.activity) {
      if (typeof mockPrismaService.activity[key] === 'function') {
        mockPrismaService.activity[key].mockReset();
      }
    }
    mockPrismaService.$queryRaw.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createActivityDto: CreateActivityDto = {
      name: 'Test Activity',
      description: 'A test description',
      category: 'Adventure',
      latitude: 10,
      longitude: 20,
      address: '123 Test St',
    };

    const expectedActivity: ActivityDto = {
      id: 'some-uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
      gallery_images: [],
      openHours: null,
      videoUrl: null,
      imageUrl: null,
      ...createActivityDto,
    };

    it('should successfully create an activity', async () => {
      mockPrismaService.activity.create.mockResolvedValue(expectedActivity);

      const result = await service.create(createActivityDto);
      expect(result).toEqual(expectedActivity);
      expect(mockPrismaService.activity.create).toHaveBeenCalledWith({
        data: {
          ...createActivityDto,
          gallery_images: [],
          openHours: null,
        },
      });
    });

    it('should handle gallery_images, openHours, videoUrl, and imageUrl correctly when provided', async () => {
      const dtoWithOptionalFields: CreateActivityDto = {
        ...createActivityDto,
        gallery_images: ['image1.jpg'],
        openHours: { monday: '9-5' },
        videoUrl: 'http://example.com/video.mp4',
        imageUrl: 'http://example.com/image.jpg',
      };
      const expectedActivityWithOptional: ActivityDto = {
        ...expectedActivity,
        gallery_images: ['image1.jpg'],
        openHours: { monday: '9-5' },
        videoUrl: 'http://example.com/video.mp4',
        imageUrl: 'http://example.com/image.jpg',
      };
      mockPrismaService.activity.create.mockResolvedValue(
        expectedActivityWithOptional,
      );

      const result = await service.create(dtoWithOptionalFields);
      expect(result).toEqual(expectedActivityWithOptional);
      expect(mockPrismaService.activity.create).toHaveBeenCalledWith({
        data: {
          ...dtoWithOptionalFields,
          gallery_images: ['image1.jpg'],
          openHours: { monday: '9-5' },
        },
      });
    });

    it('should throw InternalServerErrorException on Prisma error', async () => {
      mockPrismaService.activity.create.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.create(createActivityDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.create(createActivityDto)).rejects.toThrow(
        'Failed to create activity',
      );
    });
  });

  describe('findById', () => {
    const activityId = 'activity-id-1';

    const foundActivity: ActivityDto = {
      id: activityId,
      name: 'Found Activity',
      description: 'Description',
      category: 'Category',
      latitude: 10,
      longitude: 20,
      address: 'Address',

      videoUrl: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      gallery_images: [],
      openHours: null,
    };

    it('should return an activity if found', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(foundActivity);

      const result = await service.findById(activityId);
      expect(result).toEqual(foundActivity);
      expect(mockPrismaService.activity.findUnique).toHaveBeenCalledWith({
        where: { id: activityId },
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(service.findById(activityId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById(activityId)).rejects.toThrow(
        'Activity not found',
      );
    });
  });

  describe('findManyByIds', () => {
    const activityIds = ['id1', 'id2'];
    const foundActivities: ActivityDto[] = [
      {
        id: 'id1',
        name: 'Activity 1',
        description: 'Desc 1',
        category: 'Cat 1',
        latitude: 1,
        longitude: 2,
        address: 'Add 1',

        videoUrl: null,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        gallery_images: [],
        openHours: null,
      },
      {
        id: 'id2',
        name: 'Activity 2',
        description: 'Desc 2',
        category: 'Cat 2',
        latitude: 3,
        longitude: 4,
        address: 'Add 2',

        videoUrl: null,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        gallery_images: [],
        openHours: null,
      },
    ];

    it('should return an array of activities', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue(foundActivities);

      const result = await service.findManyByIds(activityIds);
      expect(result).toEqual(foundActivities);
      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: activityIds,
          },
        },
      });
    });

    it('should return an empty array if no activities found', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([]);

      const result = await service.findManyByIds(['non-existent-id']);
      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on Prisma error', async () => {
      mockPrismaService.activity.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.findManyByIds(activityIds)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.findManyByIds(activityIds)).rejects.toThrow(
        'Error finding by Ids',
      );
    });
  });

  describe('createMany', () => {
    const createActivitiesDto: CreateActivityDto[] = [
      {
        name: 'Activity 1',
        description: 'Desc 1',
        category: 'Cat 1',
        latitude: 1,
        longitude: 2,
        address: 'Add 1',
      },
      {
        name: 'Activity 2',
        description: 'Desc 2',
        category: 'Cat 2',
        latitude: 3,
        longitude: 4,
        address: 'Add 2',

        gallery_images: ['img2.jpg'],
        openHours: { friday: '10-6' },
        videoUrl: 'http://video2.mp4',
        imageUrl: 'http://image2.jpg',
      },
    ];

    const batchPayload = { count: 2 };

    it('should successfully create multiple activities', async () => {
      mockPrismaService.activity.createMany.mockResolvedValue(batchPayload);

      const result = await service.createMany(createActivitiesDto);
      expect(result).toEqual(batchPayload);
      expect(mockPrismaService.activity.createMany).toHaveBeenCalledWith({
        data: [
          {
            ...createActivitiesDto[0],
            gallery_images: [],
            openHours: null,
          },
          {
            ...createActivitiesDto[1],
            gallery_images: ['img2.jpg'],
            openHours: { friday: '10-6' },
          },
        ],
      });
    });

    it('should throw InternalServerErrorException on Prisma error', async () => {
      mockPrismaService.activity.createMany.mockRejectedValue(
        new InternalServerErrorException(
          'Failed to create multiple activities',
        ),
      );

      await expect(service.createMany(createActivitiesDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.createMany(createActivitiesDto)).rejects.toThrow(
        'Failed to create multiple activities',
      );
    });
  });

  describe('findActivities', () => {
    const mockActivities: ActivityDto[] = [
      {
        id: 'a1',
        name: 'Hiking Trail',
        description: 'A beautiful trail',
        category: 'Outdoor',
        latitude: 34.052235,
        longitude: -118.243683,
        address: '123 Trail Rd',

        videoUrl: null,
        imageUrl: null,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date(),
        gallery_images: [],
        openHours: null,
      },
      {
        id: 'a2',
        name: 'Museum Tour',
        description: 'Explore ancient artifacts',
        category: 'Culture',
        latitude: 34.05,
        longitude: -118.25,
        address: '456 Museum Ave',

        videoUrl: null,
        imageUrl: null,
        createdAt: new Date('2023-01-02T10:00:00Z'),
        updatedAt: new Date(),
        gallery_images: [],
        openHours: null,
      },
      {
        id: 'a3',
        name: 'Art Gallery',
        description: 'Modern art exhibition',
        category: 'Culture',
        latitude: 34.055,
        longitude: -118.24,
        address: '789 Art St',

        videoUrl: null,
        imageUrl: null,
        createdAt: new Date('2023-01-03T10:00:00Z'),
        updatedAt: new Date(),
        gallery_images: [],
        openHours: null,
      },
    ];

    it('should return activities with default limit and offset', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities);

      const result = await service.findActivities({});
      expect(result).toEqual(mockActivities);
      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith({
        where: { AND: [{}, {}] },
        take: 4,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by searchQuery (name and description)', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([
        mockActivities[0],
      ]);
      const result = await service.findActivities({ searchQuery: 'trail' });
      expect(result).toEqual([mockActivities[0]]);
      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  { name: { contains: 'trail', mode: 'insensitive' } },
                  { description: { contains: 'trail', mode: 'insensitive' } },
                ],
              },
              {},
            ],
          },
        }),
      );
    });

    it('should filter by categories', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([
        mockActivities[1],
        mockActivities[2],
      ]);
      const result = await service.findActivities({ categories: 'Culture' });
      expect(result).toEqual([mockActivities[1], mockActivities[2]]);
      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {},
              {
                category: {
                  in: ['Culture'],
                  mode: 'insensitive',
                },
              },
            ],
          },
        }),
      );
    });

    it('should apply limit and offset', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([
        mockActivities[0],
      ]);
      const result = await service.findActivities({ limit: 1, offset: 0 });
      expect(result).toEqual([mockActivities[0]]);
      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
          skip: 0,
        }),
      );
    });

    it('should sort by distance if latitude and longitude are provided', async () => {
      const activitiesForDistance: ActivityDto[] = [
        { ...mockActivities[0], latitude: 34.052235, longitude: -118.243683 },
        { ...mockActivities[1], latitude: 34.05, longitude: -118.25 },
        { ...mockActivities[2], latitude: 34.055, longitude: -118.24 },
      ];
      mockPrismaService.activity.findMany.mockResolvedValue(
        activitiesForDistance,
      );

      const userLat = 34.05;
      const userLon = -118.25;

      const result = await service.findActivities({
        latitude: userLat,
        longitude: userLon,
      });

      expect(result.length).toBe(3);
      expect(result[0].id).toBe('a2');
    });
  });

  describe('findRandomActivities', () => {
    const randomActivities: ActivityDto[] = [
      {
        id: 'rand1',
        name: 'Random Activity 1',
        description: 'Desc',
        category: 'Cat',
        latitude: 1,
        longitude: 2,
        address: 'Add',

        videoUrl: null,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        gallery_images: [],
        openHours: null,
      },
    ];

    it('should return a list of random activities', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue(randomActivities);

      const result = await service.findRandomActivities(1);

      expect(result).toEqual(randomActivities);

      expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('SELECT * FROM "Activity"'),
        ]),
        expect.any(Number),
      );
    });

    it('should use the provided limit', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue(randomActivities);

      await service.findRandomActivities(5);

      expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('LIMIT ')]),
        5,
      );
    });
  });

  describe('updateActivity', () => {
    const activityId = 'activity-to-update';
    const existingActivity: ActivityDto = {
      id: activityId,
      name: 'Original Name',
      description: 'Original Description',
      category: 'Original Category',
      latitude: 10,
      longitude: 20,
      address: 'Original Address',

      videoUrl: 'http://old-video.mp4',
      imageUrl: 'http://old-image.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      gallery_images: ['old_image.jpg'],
      openHours: { monday: '9-5' },
    };

    it('should update an existing activity', async () => {
      const updateDto: UpdateActivityDto = {
        name: 'Updated Name',
        description: 'Updated Description',
        videoUrl: 'http://new-video.mp4',
        imageUrl: 'http://new-image.jpg',
      };
      const updatedActivity: ActivityDto = {
        ...existingActivity,
        ...updateDto,
        updatedAt: new Date(),
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(existingActivity);
      mockPrismaService.activity.update.mockResolvedValue(updatedActivity);

      const result = await service.updateActivity(activityId, updateDto);
      expect(result).toEqual(updatedActivity);
      expect(mockPrismaService.activity.findUnique).toHaveBeenCalledWith({
        where: { id: activityId },
      });
      expect(mockPrismaService.activity.update).toHaveBeenCalledWith({
        where: { id: activityId },
        data: {
          name: 'Updated Name',
          description: 'Updated Description',
          videoUrl: 'http://new-video.mp4',
          imageUrl: 'http://new-image.jpg',
        },
      });
    });

    it('should handle gallery_images update to empty array', async () => {
      const updateDto: UpdateActivityDto = {
        gallery_images: [],
      };
      const updatedActivity: ActivityDto = {
        ...existingActivity,
        gallery_images: [],
        updatedAt: new Date(),
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(existingActivity);
      mockPrismaService.activity.update.mockResolvedValue(updatedActivity);

      const result = await service.updateActivity(activityId, updateDto);
      expect(result).toEqual(updatedActivity);
      expect(mockPrismaService.activity.update).toHaveBeenCalledWith({
        where: { id: activityId },
        data: {
          gallery_images: [],
        },
      });
    });

    it('should handle openHours update to null', async () => {
      const updateDto: UpdateActivityDto = {
        openHours: null,
      };
      const updatedActivity: ActivityDto = {
        ...existingActivity,
        openHours: null,
        updatedAt: new Date(),
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(existingActivity);
      mockPrismaService.activity.update.mockResolvedValue(updatedActivity);

      const result = await service.updateActivity(activityId, updateDto);
      expect(result).toEqual(updatedActivity);
      expect(mockPrismaService.activity.update).toHaveBeenCalledWith({
        where: { id: activityId },
        data: {
          openHours: null,
        },
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(service.updateActivity(activityId, {})).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateActivity(activityId, {})).rejects.toThrow(
        'Activity not found',
      );
    });

    it('should throw InternalServerErrorException on Prisma error during update', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(existingActivity);
      mockPrismaService.activity.update.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.updateActivity(activityId, {})).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.updateActivity(activityId, {})).rejects.toThrow(
        'Failed to update activity',
      );
    });
  });

  describe('deleteActivity', () => {
    const activityId = 'activity-to-delete';
    const deletedActivity: ActivityDto = {
      id: activityId,
      name: 'Deleted Activity',
      description: 'Description',
      category: 'Category',
      latitude: 10,
      longitude: 20,
      address: 'Address',

      videoUrl: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      gallery_images: [],
      openHours: null,
    };

    it('should delete an activity', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(deletedActivity);
      mockPrismaService.activity.delete.mockResolvedValue(deletedActivity);

      const result = await service.deleteActivity(activityId);
      expect(result).toEqual(deletedActivity);
      expect(mockPrismaService.activity.findUnique).toHaveBeenCalledWith({
        where: { id: activityId },
      });
      expect(mockPrismaService.activity.delete).toHaveBeenCalledWith({
        where: { id: activityId },
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(service.deleteActivity(activityId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteActivity(activityId)).rejects.toThrow(
        'Activity not found',
      );
    });

    it('should throw InternalServerErrorException on Prisma error during delete', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(deletedActivity);
      mockPrismaService.activity.delete.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.deleteActivity(activityId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.deleteActivity(activityId)).rejects.toThrow(
        'Failed to delete activity',
      );
    });
  });
});
