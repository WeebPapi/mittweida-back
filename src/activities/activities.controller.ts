import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActivitySearch } from './interfaces';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Prisma } from 'generated/prisma';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}
  @Get()
  async findAll(@Query() query: ActivitySearch) {
    return this.activitiesService.findActivities(query);
  }

  @Get('random')
  async findRandom(
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 4,
  ) {
    return this.activitiesService.findRandomActivities(limit);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUSINESS_OWNER')
  async create(@Body() createActivityDto: CreateActivityDto) {
    return await this.activitiesService.create(createActivityDto);
  }
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUSINESS_OWNER')
  async updateActivity(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return await this.activitiesService.updateActivity(id, updateActivityDto);
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUSINESS_OWNER')
  async delete(@Param('id') id: string) {
    return await this.activitiesService.deleteActivity(id);
  }
}
