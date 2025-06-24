import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Prisma } from 'generated/prisma';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import { GroupAdminCheckGuard } from './group-admin-check/group-admin-check.guard';
import { TokenPayload } from 'src/auth/interfaces';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  //create group
  @Post()
  @UseGuards(JwtAuthGuard)
  async createGroup(
    @Req() request: Request,
    @Body() createGroupDto: Omit<Prisma.GroupCreateInput, 'code'>,
  ) {
    return this.groupsService.create(
      createGroupDto,
      (request?.user as TokenPayload).id,
    );
  }

  //join a group
  @Post('join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(@Req() request: Request, @Body('code') code: string) {
    console.log('Request here:', request.user);
    return this.groupsService.join(
      { id: (request.user as TokenPayload).id as string },
      code,
    );
  }

  //leave a group
  @Post('leave')
  @UseGuards(JwtAuthGuard)
  async leaveGroup(@Req() request: Request, @Body('groupId') groupId: string) {
    return this.groupsService.leave((request.user as TokenPayload).id, groupId);
  }

  //get group with id
  @Get(':id')
  async getGroupById(@Param('id') id: string) {
    return this.groupsService.findGroup(id);
  }

  //Update group
  @Put(':id')
  @UseGuards(JwtAuthGuard, GroupAdminCheckGuard)
  async updateGroup(
    @Param('id')
    id: string,
    @Body() updateGroupDto: Prisma.GroupUpdateInput,
  ) {
    return this.groupsService.updateGroup(id, updateGroupDto);
  }

  //Delete group
  @Delete(':id')
  @UseGuards(JwtAuthGuard, GroupAdminCheckGuard)
  async deleteGroup(@Param('id') id: string) {
    return this.groupsService.delete(id);
  }
}
