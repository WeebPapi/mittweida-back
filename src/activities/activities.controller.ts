import { Controller, Get, Query } from '@nestjs/common';
import { ActivitySearch } from './interfaces';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}
  @Get()
  findAll(@Query() query: ActivitySearch) {
    return this.activitiesService.findActivities(query);
  }
}
