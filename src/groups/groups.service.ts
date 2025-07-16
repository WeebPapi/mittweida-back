import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Group, Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
  ) {}
  private async generateCode() {
    const symbols = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ];
    while (true) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += symbols[Math.floor(Math.random() * symbols.length)];
      }
      const codeExists = await this.prismaService.group.findUnique({
        where: { code },
      });
      if (!codeExists) return code;
    }
  }
  async instantiateGroupMember(
    user: { id: string },
    group: Group,
    isAdmin: boolean,
  ) {
    const member = await this.prismaService.groupMember.create({
      data: {
        userId: user.id,
        groupId: group.id,
        isAdmin,
      },
    });
    return member;
  }
  async create(createGroupDto: CreateGroupDto, id: string) {
    let code = await this.generateCode();
    try {
      const group = await this.prismaService.group.create({
        data: { ...createGroupDto, code },
      });
      await this.instantiateGroupMember(
        await this.usersService.findById(id),
        group,
        true,
      );
      return group;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Group code already exists');
        }
      }
      throw new InternalServerErrorException('Failed to create group');
    }
  }
  async findGroup(id: string) {
    return this.prismaService.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        photos: {},
        polls: {},
      },
    });
  }
  async updateGroup(id: string, updateGroupDto: UpdateGroupDto) {
    const group = await this.prismaService.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Group Not found');
    try {
      const updatedGroup = await this.prismaService.group.update({
        where: { id },
        data: updateGroupDto,
      });
      return updatedGroup;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update group');
    }
  }
  async join(user: { id: string }, code: string) {
    const group = await this.prismaService.group.findUnique({
      where: { code },
      include: { members: true },
    });
    if (!group) throw new NotFoundException('Group not found');

    const isMember = group.members.some((m) => m.userId === user.id);
    if (isMember) {
      throw new ConflictException('User already a member');
    }
    const member = await this.instantiateGroupMember(
      user,
      group as Group,
      false,
    );

    return member;
  }
  async leave(userId: string, groupId: string) {
    const member = await this.prismaService.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });
    if (!member) throw new NotFoundException('Member not found');
    try {
      await this.prismaService.groupMember.delete({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });
      return { message: 'Successfully left group' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to leave group');
    }
  }
  async delete(id: string) {
    const group = await this.prismaService.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');
    try {
      return await this.prismaService.group.delete({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete group');
    }
  }
}
