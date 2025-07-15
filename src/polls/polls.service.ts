import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Poll, Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { UsersService } from 'src/users/users.service';
import { ActivitiesService } from 'src/activities/activities.service';
import { UpdatePollDto } from './dto/update-poll.dto';

@Injectable()
export class PollsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async findById(id: string): Promise<Poll | null> {
    try {
      return this.prismaService.poll.findUnique({
        where: { id },
        include: {
          options: {
            include: {
              activity: true,
              votes: true,
            },
          },
          user: { select: { id: true, firstName: true, lastName: true } },
          group: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Poll not found');
    }
  }

  async findMostRecentPollByGroupId(groupId: string): Promise<Poll | null> {
    try {
      const mostRecentPoll = await this.prismaService.poll.findFirst({
        where: {
          groupId: groupId,
        },
        include: {
          options: {
            include: {
              activity: true,
              votes: true,
            },
          },
          user: { select: { id: true, firstName: true, lastName: true } },
          group: { select: { id: true, name: true } },
        },
        orderBy: {
          expiresAt: 'desc',
        },
      });

      return mostRecentPoll;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve most recent poll for group.',
      );
    }
  }

  async create(createPollDto: CreatePollDto, userId: string) {
    const { question, groupId, expiresAt, selectedActivityIds } = createPollDto;
    const groupMember = await this.prismaService.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: groupId,
        },
      },
    });

    if (!groupMember) {
      throw new ForbiddenException('You are not a member of this group.');
    }

    try {
      // Added try-catch block here
      const activities =
        await this.activitiesService.findManyByIds(selectedActivityIds);
      const newPoll = await this.prismaService.$transaction(async (prisma) => {
        const poll = await prisma.poll.create({
          data: {
            question,
            groupId,
            expiresAt,
            createdBy: userId,
          },
        });

        const pollOptionsData = activities.map((activity) => ({
          text: activity.name,
          activityId: activity.id,
          pollId: poll.id,
        }));

        await prisma.pollOption.createMany({
          data: pollOptionsData,
        });

        return prisma.poll.findUnique({
          where: { id: poll.id },
          include: { options: { include: { activity: true } } },
        });
      });

      return newPoll;
    } catch (error) {
      // It's good practice to log the original error for debugging purposes
      // console.error('Error creating poll in transaction:', error);
      throw new InternalServerErrorException(
        'Failed to create poll due to a server error.',
      );
    }
  }

  async voteOnPoll(pollId: string, pollOptionId: string, userId: string) {
    if (
      !(await this.findById(pollId)) ||
      !(await this.usersService.findById(userId))
    )
      throw new NotFoundException('The poll, option or user was not found');
    const poll = await this.prismaService.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          where: { id: pollOptionId },
        },
        group: {
          select: { id: true },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException(`Poll with ID "${pollId}" not found.`);
    }

    if (poll.expiresAt < new Date()) {
      throw new BadRequestException('This poll has already expired.');
    }

    if (!poll.options || poll.options.length === 0) {
      throw new BadRequestException(
        `Poll option with ID "${pollOptionId}" does not belong to poll "${pollId}".`,
      );
    }

    const groupMember = await this.prismaService.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: poll.groupId,
        },
      },
    });

    if (!groupMember) {
      throw new ForbiddenException(
        'You must be a member of this group to vote on this poll.',
      );
    }
    await this.prismaService.pollVote.create({
      data: { pollId, pollOptionId, userId },
    });
    return { message: 'Successfully voted' };
  }

  async update(id: string, updatePollDto: UpdatePollDto) {
    const poll = await this.findById(id);
    if (!poll) throw new NotFoundException('Poll not found');
    try {
      return this.prismaService.poll.update({
        where: { id },
        data: updatePollDto,
      });
    } catch (error) {
      throw new InternalServerErrorException('Error updating poll');
    }
  }

  async delete(id: string) {
    return this.prismaService.poll.delete({ where: { id } });
  }
}
