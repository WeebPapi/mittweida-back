import { Module } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { ActivitiesModule } from 'src/activities/activities.module';
import { UsersModule } from 'src/users/users.module';
import { GroupsModule } from 'src/groups/groups.module';
import { GroupsService } from 'src/groups/groups.service';
import { ActivitiesService } from 'src/activities/activities.service';

@Module({
  imports: [ActivitiesModule, UsersModule, GroupsModule],
  providers: [PollsService, GroupsService, ActivitiesService],
  controllers: [PollsController],
})
export class PollsModule {}
