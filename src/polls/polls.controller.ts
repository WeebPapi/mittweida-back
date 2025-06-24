import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { Prisma } from 'generated/prisma';

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}
  @Get(':id')
  async getPoll(@Param('id') id: string) {
    return this.pollsService.findById(id);
  }
  @Post()
  async createPoll(@Body() createPollDto: Prisma.PollCreateInput) {
    return this.pollsService.create(createPollDto);
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
