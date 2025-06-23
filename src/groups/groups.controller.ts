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
  async createGroup(
    @Body() createGroupDto: Omit<Prisma.GroupCreateInput, 'code'>,
  ) {
    return this.groupsService.create(createGroupDto);
  }
  @Post('join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(@Req() request: Request, code: string) {
    return this.groupsService.join(request?.user as User, code);
  }
  @Get(':id')
  async getGroupById(@Param('id') id: string) {
    return this.groupsService.findGroup(id);
  }
  @Put(':id')
  async updateGroup(
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
