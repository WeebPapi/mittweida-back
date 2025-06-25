import { Module } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { PhotosController } from './photos.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [PhotosService, PrismaService],
  controllers: [PhotosController],
  exports: [PhotosService],
})
export class PhotosModule {}
