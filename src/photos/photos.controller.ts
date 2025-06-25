// src/photos/photos.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  UseGuards,
  Get,
  Param,
  Delete,
  ForbiddenException,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotosService } from './photos.service';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import { TokenPayload } from 'src/auth/interfaces';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadPhotoDto: UploadPhotoDto,
    @Req() request: Request,
  ) {
    const userId = (request.user as TokenPayload).id;
    return this.photosService.uploadPhoto(file, uploadPhotoDto, userId);
  }

  @Get(':id')
  async getPhoto(@Param('id') id: string) {
    return this.photosService.getPhotoById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updatePhoto(
    @Param('id') id: string,
    @Body() updatePhotoDto: UpdatePhotoDto,
    @Req() request: Request,
  ) {
    const userId = (request.user as TokenPayload).id;

    return this.photosService.updatePhoto(id, updatePhotoDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePhoto(@Param('id') id: string, @Req() request: Request) {
    const userId = (request.user as TokenPayload).id;
    return this.photosService.deletePhoto(id, userId);
  }

  // Add endpoints to get photos by user or group if needed
  @Get('user/:userId')
  async getPhotosByUser(@Param('userId') userId: string) {
    return this.photosService.getPhotosByUserId(userId);
  }

  @Get('group/:groupId')
  async getPhotosByGroup(@Param('groupId') groupId: string) {
    return this.photosService.getPhotosByGroupId(groupId);
  }
}
