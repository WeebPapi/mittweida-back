import { Test, TestingModule } from '@nestjs/testing';
import { PhotosService } from './photos.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Photo } from 'generated/prisma';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { Readable } from 'stream';

const mockS3Client = {
  send: jest.fn(),
};

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    done: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('PhotosService', () => {
  let service: PhotosService;
  let prisma: PrismaService;
  let configService: ConfigService;

  const mockPhoto: Photo = {
    id: 'photo-id-1',
    url: 'https://mockbucket.s3.mockregion.amazonaws.com/photos/mock-uuid.jpg',
    caption: 'Test Photo',
    location: 'Test Location',
    userId: 'user-id-1',
    groupId: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        {
          provide: PrismaService,
          useValue: {
            photo: {
              create: jest.fn().mockResolvedValue(mockPhoto),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AWS_S3_REGION') return 'mockregion';
              if (key === 'AWS_S3_BUCKET_NAME') return 'mockbucket';
              if (key === 'AWS_ACCESS_KEY_ID') return 'mockAccessKey';
              if (key === 'AWS_SECRET_ACCESS_KEY') return 'mockSecretKey';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PhotosService>(PhotosService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    (service as any).s3 = mockS3Client;
    (service as any).bucketName = 'mockbucket';
    (service as any).region = 'mockregion';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadPhoto', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('mock image data'),
      stream: new Readable(),
      destination: '',
      filename: '',
      path: '',
    };
    const uploadDto: UploadPhotoDto = {
      caption: 'My new photo',
      location: 'Somewhere',
      groupId: 'group-id-1',
    };
    const userId = 'test-user-id';

    it('should throw BadRequestException if no file is uploaded', async () => {
      await expect(
        service.uploadPhoto(null as any, uploadDto, userId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadPhoto(null as any, uploadDto, userId),
      ).rejects.toThrow('No file uploaded.');
    });

    it('should successfully upload a file and create a photo entry', async () => {
      (prisma.photo.create as jest.Mock).mockResolvedValue(mockPhoto);

      const result = await service.uploadPhoto(mockFile, uploadDto, userId);

      const { Upload } = require('@aws-sdk/lib-storage');
      expect(Upload).toHaveBeenCalledTimes(1);
      expect(Upload).toHaveBeenCalledWith(
        expect.objectContaining({
          client: mockS3Client,
          params: {
            Bucket: 'mockbucket',
            Key: 'photos/mock-uuid.jpg',
            Body: mockFile.buffer,
            ContentType: mockFile.mimetype,
            ACL: 'public-read',
          },
        }),
      );

      expect(prisma.photo.create).toHaveBeenCalledWith({
        data: {
          url: expect.stringContaining(
            'mockbucket.s3.mockregion.amazonaws.com/photos/mock-uuid.jpg',
          ),
          caption: uploadDto.caption,
          location: uploadDto.location,
          userId: userId,
          groupId: uploadDto.groupId,
        },
      });
      expect(result).toEqual(mockPhoto);
    });
  });

  describe('getPhotoById', () => {
    it('should return a photo if found', async () => {
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue(mockPhoto);
      const result = await service.getPhotoById('photo-id-1');
      expect(result).toEqual(mockPhoto);
      expect(prisma.photo.findUnique).toHaveBeenCalledWith({
        where: { id: 'photo-id-1' },
      });
    });

    it('should return null if photo not found', async () => {
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.getPhotoById('non-existent-id');
      expect(result).toBeNull();
      expect(prisma.photo.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });
  });

  describe('updatePhoto', () => {
    const updateDto: UpdatePhotoDto = { caption: 'Updated Caption' };
    const ownerId = 'owner-user-id';
    const nonOwnerId = 'another-user-id';

    it('should throw NotFoundException if photo not found', async () => {
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.updatePhoto('non-existent-id', updateDto, ownerId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updatePhoto('non-existent-id', updateDto, ownerId),
      ).rejects.toThrow('Photo not found.');
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue({
        ...mockPhoto,
        userId: ownerId,
      });
      await expect(
        service.updatePhoto(mockPhoto.id, updateDto, nonOwnerId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updatePhoto(mockPhoto.id, updateDto, nonOwnerId),
      ).rejects.toThrow('You are not authorized to update this photo.');
    });

    it('should successfully update a photo', async () => {
      const updatedPhoto = { ...mockPhoto, caption: 'Updated Caption' };
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue({
        ...mockPhoto,
        userId: ownerId,
      });
      (prisma.photo.update as jest.Mock).mockResolvedValue(updatedPhoto);

      const result = await service.updatePhoto(
        mockPhoto.id,
        updateDto,
        ownerId,
      );

      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { id: mockPhoto.id },
        data: updateDto,
      });
      expect(result).toEqual(updatedPhoto);
    });
  });

  describe('deletePhoto', () => {
    const ownerId = 'owner-user-id';
    const nonOwnerId = 'another-user-id';
    const photoToDelete = {
      ...mockPhoto,
      userId: ownerId,
      url: 'https://mockbucket.s3.mockregion.amazonaws.com/photos/delete-me.jpg',
    };

    it('should throw NotFoundException if photo not found', async () => {
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.deletePhoto('non-existent-id', ownerId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deletePhoto('non-existent-id', ownerId),
      ).rejects.toThrow('Photo not found.');
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue(photoToDelete);
      await expect(
        service.deletePhoto(photoToDelete.id, nonOwnerId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.deletePhoto(photoToDelete.id, nonOwnerId),
      ).rejects.toThrow('You are not authorized to delete this photo.');
    });

    it('should successfully delete photo from S3 and DB', async () => {
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue(photoToDelete);
      (mockS3Client.send as jest.Mock).mockResolvedValue({});
      (prisma.photo.delete as jest.Mock).mockResolvedValue(photoToDelete);

      const result = await service.deletePhoto(photoToDelete.id, ownerId);

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: 'mockbucket',
            Key: 'photos/delete-me.jpg',
          },
        }),
      );
      expect(prisma.photo.delete).toHaveBeenCalledWith({
        where: { id: photoToDelete.id },
      });
      expect(result).toEqual(photoToDelete);
    });
  });

  describe('getPhotosByUserId', () => {
    const photosByUser: Photo[] = [
      { ...mockPhoto, id: 'p1', userId: 'user-A' },
      { ...mockPhoto, id: 'p2', userId: 'user-A' },
    ];

    it('should return an array of photos for a given user ID', async () => {
      (prisma.photo.findMany as jest.Mock).mockResolvedValue(photosByUser);
      const result = await service.getPhotosByUserId('user-A');
      expect(result).toEqual(photosByUser);
      expect(prisma.photo.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-A' },
      });
    });

    it('should return an empty array if no photos found for user', async () => {
      (prisma.photo.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.getPhotosByUserId('non-existent-user');
      expect(result).toEqual([]);
      expect(prisma.photo.findMany).toHaveBeenCalledWith({
        where: { userId: 'non-existent-user' },
      });
    });
  });

  describe('getPhotosByGroupId', () => {
    const photosByGroup: Photo[] = [
      { ...mockPhoto, id: 'p3', groupId: 'group-X' },
      { ...mockPhoto, id: 'p4', groupId: 'group-X' },
    ];

    it('should return an array of photos for a given group ID', async () => {
      (prisma.photo.findMany as jest.Mock).mockResolvedValue(photosByGroup);
      const result = await service.getPhotosByGroupId('group-X');
      expect(result).toEqual(photosByGroup);
      expect(prisma.photo.findMany).toHaveBeenCalledWith({
        where: { groupId: 'group-X' },
      });
    });

    it('should return an empty array if no photos found for group', async () => {
      (prisma.photo.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.getPhotosByGroupId('non-existent-group');
      expect(result).toEqual([]);
      expect(prisma.photo.findMany).toHaveBeenCalledWith({
        where: { groupId: 'non-existent-group' },
      });
    });
  });
});
