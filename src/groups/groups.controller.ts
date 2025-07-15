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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import { GroupAdminCheckGuard } from './group-admin-check/group-admin-check.guard';
import { TokenPayload } from 'src/auth/interfaces';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new group' })
  @ApiBearerAuth()
  @ApiBody({
    type: CreateGroupDto,
    description: 'Data for creating a new group (excluding code)',
  })
  @ApiResponse({
    status: 201,
    description: 'The group has been successfully created.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createGroup(
    @Req() request: Request,
    @Body() createGroupDto: Omit<CreateGroupDto, 'code'>,
  ) {
    return this.groupsService.create(
      createGroupDto,
      (request?.user as TokenPayload).id,
    );
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Join an existing group using its code' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'The unique code of the group' },
      },
      required: ['code'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined the group.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Group not found or invalid code.' })
  async joinGroup(@Req() request: Request, @Body('code') code: string) {
    return this.groupsService.join(
      { id: (request.user as TokenPayload).id as string },
      code,
    );
  }

  @Post('leave')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Leave a group' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'string',
          description: 'The ID of the group to leave',
        },
      },
      required: ['groupId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully left the group.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async leaveGroup(@Req() request: Request, @Body('groupId') groupId: string) {
    return this.groupsService.leave((request.user as TokenPayload).id, groupId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a group by its ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the group to retrieve',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'The group details.',
  })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async getGroupById(@Param('id') id: string) {
    return this.groupsService.findGroup(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, GroupAdminCheckGuard)
  @ApiOperation({ summary: 'Update an existing group by ID' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'The ID of the group to update',
    type: 'string',
  })
  @ApiBody({
    type: UpdateGroupDto,
    description: 'Data for updating the group',
  })
  @ApiResponse({
    status: 200,
    description: 'The group has been successfully updated.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Not a group admin).' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async updateGroup(
    @Param('id')
    id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroup(id, updateGroupDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, GroupAdminCheckGuard)
  @ApiOperation({ summary: 'Delete a group by ID' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'The ID of the group to delete',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'The group has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Not a group admin).' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async deleteGroup(@Param('id') id: string) {
    return this.groupsService.delete(id);
  }
}
