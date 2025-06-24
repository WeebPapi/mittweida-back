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
import { Prisma } from 'generated/prisma';
import { CreatePollDto } from './create-poll.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TokenPayload } from 'src/auth/interfaces';
import { Request } from 'express';
import { CreatePollVoteDto } from './create-poll-vote.dto';

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}
  @Get(':id')
  async getPoll(@Param('id') id: string) {
    return this.pollsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
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
  async updatePoll(
    @Param('id') id: string,
    @Body() createPollDto: Prisma.PollCreateInput,
  ) {
    return this.pollsService.update(id, createPollDto);
  }
  @Delete(':id')
  async deletePoll(@Param('id') id: string) {
    return this.pollsService.delete(id);
  }
}
