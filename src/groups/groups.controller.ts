import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Prisma, User } from 'generated/prisma';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  async createGroup(
    @Req() request: Request,
    @Body() createGroupDto: Omit<Prisma.GroupCreateInput, 'code'>,
  ) {
    return this.groupsService.create(
      createGroupDto,
      (request?.user as any).sub,
    );
  }
  @Post('join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(@Req() request: Request, @Body('code') code: string) {
    console.log('Request here:', request.user);
    return this.groupsService.join(
      { id: (request.user as any).sub as string },
      code,
    );
  }
  @Post('leave')
  @UseGuards(JwtAuthGuard)
  async leaveGroup(@Req() request: any, @Body('groupId') groupId: string) {
    return this.groupsService.leave(request.user.sub, groupId);
  }
  @Get(':id')
  async getGroupById(@Param('id') id: string) {
    return this.groupsService.findGroup(id);
  }
  @Put(':id')
  async updateGroup(
    @Param('id')
    id: string,
    @Body() updateGroupDto: Prisma.GroupUpdateInput,
  ) {
    return this.groupsService.updateGroup(id, updateGroupDto);
  }
  @Delete(':id')
  async deleteGroup(@Param('id') id: string) {
    return this.groupsService.delete(id);
  }
}
