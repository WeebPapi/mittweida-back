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
  Put,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotosService } from './photos.service';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import { TokenPayload } from 'src/auth/interfaces';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';

const PhotoSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the photo',
    },
    url: { type: 'string', description: 'URL of the photo' },
    caption: {
      type: 'string',
      nullable: true,
      description: 'Optional caption for the photo',
    },
    location: {
      type: 'string',
      nullable: true,
      description: 'Optional location where the photo was taken',
    },
    userId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the user who uploaded the photo',
    },
    groupId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      description: 'Optional ID of the group this photo belongs to',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when the photo was created',
    },
  },
  required: ['id', 'url', 'userId', 'createdAt'],
};

@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a new photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Photo file and optional metadata',
    type: UploadPhotoDto,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The photo file to upload',
        },
        caption: {
          type: 'string',
          description: 'Optional caption for the photo',
          example: 'A beautiful sunset.',
        },
        location: {
          type: 'string',
          description: 'Optional location where the photo was taken',
          example: 'Paris, France',
        },
        groupId: {
          type: 'string',
          format: 'uuid',
          description: 'Optional ID of the group this photo belongs to',
          example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The photo has been successfully uploaded.',
    schema: PhotoSchema,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadPhotoDto: UploadPhotoDto,
    @Req() request: Request,
  ) {
    const userId = (request.user as TokenPayload).id;
    return this.photosService.uploadPhoto(file, uploadPhotoDto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a photo by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the photo', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the photo with the specified ID.',
    schema: PhotoSchema,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Photo not found.',
  })
  async getPhoto(@Param('id') id: string) {
    return this.photosService.getPhotoById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing photo' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the photo to update',
    type: String,
  })
  @ApiBody({ type: UpdatePhotoDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The photo has been successfully updated.',
    schema: PhotoSchema,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Photo not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden (user does not own the photo).',
  })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a photo by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the photo to delete',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The photo has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Photo not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden (user does not own the photo).',
  })
  async deletePhoto(@Param('id') id: string, @Req() request: Request) {
    const userId = (request.user as TokenPayload).id;
    return this.photosService.deletePhoto(id, userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Retrieve all photos by a specific user' })
  @ApiParam({ name: 'userId', description: 'The ID of the user', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns an array of photos by the specified user.',
    schema: { type: 'array', items: PhotoSchema },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or photos not found.',
  })
  async getPhotosByUser(@Param('userId') userId: string) {
    return this.photosService.getPhotosByUserId(userId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Retrieve all photos by a specific group' })
  @ApiParam({
    name: 'groupId',
    description: 'The ID of the group',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Returns an array of photos associated with the specified group.',
    schema: { type: 'array', items: PhotoSchema },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group or photos not found.',
  })
  async getPhotosByGroup(@Param('groupId') groupId: string) {
    return this.photosService.getPhotosByGroupId(groupId);
  }
}
