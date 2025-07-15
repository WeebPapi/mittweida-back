import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TokenPayload } from 'src/auth/interfaces';
import { Request } from 'express';
import { CreatePollVoteDto } from './dto/create-poll-vote.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Polls')
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get('/group/:id')
  @ApiOperation({ summary: 'Get the most recent poll for a specific group' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the group',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Returns the most recent poll.' })
  @ApiResponse({ status: 404, description: 'Group or poll not found.' })
  async getPollByGroup(@Param('id') id: string) {
    return this.pollsService.findMostRecentPollByGroupId(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a poll by its ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the poll',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Returns the poll.' })
  @ApiResponse({ status: 404, description: 'Poll not found.' })
  async getPoll(@Param('id') id: string) {
    return this.pollsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new poll' })
  @ApiBody({ type: CreatePollDto, description: 'Data for creating a new poll' })
  @ApiResponse({
    status: 201,
    description: 'The poll has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createPoll(
    @Body() createPollDto: CreatePollDto,
    @Req() request: Request,
  ) {
    const userId = (request.user as TokenPayload).id;
    if (!userId) throw new UnauthorizedException();
    return this.pollsService.create(createPollDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/vote')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a poll option' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the poll to vote on',
    type: String,
    format: 'uuid',
  })
  @ApiBody({
    type: CreatePollVoteDto,
    description: 'Data for casting a vote on a poll option',
  })
  @ApiResponse({
    status: 200,
    description: 'The vote has been successfully recorded.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Poll or poll option not found.' })
  async voteOnPoll(
    @Param('id') pollId: string,
    @Body() createPollVoteDto: CreatePollVoteDto,
    @Req() request: Request,
  ) {
    const userId = (request.user as TokenPayload).id;
    const { pollOptionId } = createPollVoteDto;

    return this.pollsService.voteOnPoll(pollId, pollOptionId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing poll' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the poll to update',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: UpdatePollDto, description: 'Data for updating the poll' })
  @ApiResponse({
    status: 200,
    description: 'The poll has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Poll not found.' })
  async updatePoll(
    @Param('id') id: string,
    @Body() createPollDto: UpdatePollDto,
  ) {
    return this.pollsService.update(id, createPollDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a poll' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the poll to delete',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'The poll has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Poll not found.' })
  async deletePoll(@Param('id') id: string) {
    return this.pollsService.delete(id);
  }
}
