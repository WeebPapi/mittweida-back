import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [AuthModule],
  providers: [GroupsService, UsersService],
  controllers: [GroupsController],
})
export class GroupsModule {}
