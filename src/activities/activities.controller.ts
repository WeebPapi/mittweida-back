import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  ValidationPipe,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivitySearch } from './dto/activity-search.dto';
import { ActivityDto } from './dto/activity.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiProperty,
} from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

class BatchPayloadDto {
  @ApiProperty({ description: 'The number of records affected', example: 5 })
  @IsNumber()
  count: number;
}

@ApiTags('Activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all activities with optional filtering and pagination',
  })
  @ApiQuery({
    type: ActivitySearch,
    description:
      'Parameters for searching, filtering, and paginating activities',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved a list of activities',
    type: [ActivityDto],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async findAll(
    @Query()
    query: ActivitySearch,
  ): Promise<ActivityDto[]> {
    return this.activitiesService.findActivities(query);
  }

  @Get('/random')
  @ApiOperation({ summary: 'Get a specified number of random activities' })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'The number of random activities to return (default: 4)',
    required: false,
    example: 4,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved random activities',
    type: [ActivityDto],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async findRandom(
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 4,
  ): Promise<ActivityDto[]> {
    return this.activitiesService.findRandomActivities(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an activity by its ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the activity',
    type: String,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the activity',
    type: ActivityDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Activity with the given ID not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async findOne(@Param('id') id: string): Promise<ActivityDto> {
    return this.activitiesService.findById(id);
  }

  @Post()
  @ApiSecurity('accessTokenCookie')
  @ApiOperation({
    summary: 'Create a new activity (requires ADMIN or BUSINESS_OWNER role)',
  })
  @ApiBody({
    type: CreateActivityDto,
    description: 'Data for creating a new activity',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The activity has been successfully created',
    type: ActivityDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Authentication required (missing or invalid access token cookie)',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have the required role (ADMIN or BUSINESS_OWNER)',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUSINESS_OWNER')
  async create(
    @Body() createActivityDto: CreateActivityDto,
  ): Promise<ActivityDto> {
    return await this.activitiesService.create(createActivityDto);
  }

  @Post('/createMany')
  @ApiSecurity('accessTokenCookie')
  @ApiOperation({
    summary:
      'Create multiple new activities (requires ADMIN or BUSINESS_OWNER role)',
  })
  @ApiBody({
    type: [CreateActivityDto],
    description: 'Array of data for creating multiple activities',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Activities have been successfully created',
    type: BatchPayloadDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have the required role',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create activities',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUSINESS_OWNER')
  async createMany(
    @Body() body: CreateActivityDto[],
  ): Promise<BatchPayloadDto> {
    return this.activitiesService.createMany(body);
  }

  @Put(':id')
  @ApiSecurity('accessTokenCookie')
  @ApiOperation({
    summary:
      'Update an existing activity by ID (requires ADMIN or BUSINESS_OWNER role)',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the activity to update',
    type: String,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiBody({
    type: UpdateActivityDto,
    description: 'Data for updating the activity',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The activity has been successfully updated',
    type: ActivityDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Activity with the given ID not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format or invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Authentication required (missing or invalid access token cookie)',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have the required role (ADMIN or BUSINESS_OWNER)',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUSINESS_OWNER')
  async updateActivity(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ): Promise<ActivityDto> {
    return await this.activitiesService.updateActivity(id, updateActivityDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiSecurity('accessTokenCookie')
  @ApiOperation({
    summary: 'Delete an activity by ID (requires ADMIN or BUSINESS_OWNER role)',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the activity to delete',
    type: String,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description:
      'The activity has been successfully deleted (no content returned)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Activity with the given ID not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Authentication required (missing or invalid access token cookie)',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have the required role (ADMIN or BUSINESS_OWNER)',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUSINESS_OWNER')
  async delete(@Param('id') id: string): Promise<void> {
    await this.activitiesService.deleteActivity(id);
  }
}
