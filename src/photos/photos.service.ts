import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Photo } from 'generated/prisma';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PhotosService {
  private s3: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.region = this.configService.get<string>('AWS_S3_REGION')!;
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME')!;

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        )!,
      },
    });
  }

  async uploadPhoto(
    file: Express.Multer.File,
    uploadPhotoDto: UploadPhotoDto,
    userId: string,
  ): Promise<Photo> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuid()}.${fileExtension}`;
    const s3Key = `photos/${fileName}`;

    try {
      const parallelUploads3 = new Upload({
        client: this.s3,
        params: {
          Bucket: this.bucketName,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'private',
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5,
      });

      parallelUploads3.on('httpUploadProgress', (progress) => {
        console.log(progress);
      });

      await parallelUploads3.done();

      const photoUrl = `s3://${this.bucketName}/${s3Key}`;

      const newPhoto = await this.prisma.photo.create({
        data: {
          url: photoUrl,
          caption: uploadPhotoDto.caption,
          location: uploadPhotoDto.location,
          userId: userId,
          groupId: uploadPhotoDto.groupId,
        },
      });

      return newPhoto;
    } catch (error) {
      console.error('Error uploading to S3 or saving to DB:', error);
      throw new BadRequestException('Failed to upload photo.');
    }
  }

  async updatePhoto(
    id: string,
    updatePhotoDto: UpdatePhotoDto,
    userId: string,
  ): Promise<Photo> {
    const photo = await this.prisma.photo.findUnique({ where: { id } });

    if (!photo) {
      throw new NotFoundException('Photo not found.');
    }

    if (photo.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to update this photo.',
      );
    }

    return this.prisma.photo.update({
      where: { id },
      data: updatePhotoDto,
    });
  }

  async getPhotoById(id: string): Promise<Photo | null> {
    const photo = await this.prisma.photo.findUnique({ where: { id } });
    if (!photo) return null;

    return photo;
  }

  async deletePhoto(id: string, userId: string): Promise<Photo> {
    const photo = await this.prisma.photo.findUnique({ where: { id } });

    if (!photo) {
      throw new NotFoundException('Photo not found.');
    }

    if (photo.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this photo.',
      );
    }

    const s3Key = photo.url.replace(`s3://${this.bucketName}/`, '');
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      }),
    );

    return this.prisma.photo.delete({ where: { id } });
  }

  async getPhotosByUserId(userId: string): Promise<Photo[]> {
    return this.prisma.photo.findMany({ where: { userId } });
  }

  async getPhotosByGroupId(groupId: string): Promise<Photo[]> {
    return this.prisma.photo.findMany({ where: { groupId } });
  }
  async;
}
