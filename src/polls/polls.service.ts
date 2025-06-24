import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Poll, Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePollDto } from './create-poll.dto';
import { UsersService } from 'src/users/users.service';
import { GroupsService } from 'src/groups/groups.service';
import { ActivitiesService } from 'src/activities/activities.service';

@Injectable()
export class PollsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async findById(id: string): Promise<Poll | null> {
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

  async update(id: string, updatePollDto: Prisma.PollUpdateInput) {
    return this.prismaService.poll.update({
      where: { id },
      data: updatePollDto,
    });
  }
  async delete(id: string) {
    return this.prismaService.poll.delete({ where: { id } });
  }
}
