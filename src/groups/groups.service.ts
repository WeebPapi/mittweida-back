import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Group, User } from 'generated/prisma';
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
  async instantiateGroupMember(user: User, group: Group, isAdmin: boolean) {
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
    const group = await this.prismaService.group.create({
      data: { ...createGroupDto, code },
    });
    await this.instantiateGroupMember(
      await this.usersService.findById(id),
      group,
      true,
    );
    return group;
  }
  async findGroup(id: string) {
    return this.prismaService.group.findUnique({ where: { id } });
  }
  async updateGroup(id: string, updateGroupDto: UpdateGroupDto) {
    return this.prismaService.group.update({
      where: { id },
      data: updateGroupDto,
    });
  }
  async join(user, code: string) {
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
    await this.prismaService.groupMember.delete({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });
    return { message: 'Successfully left group' };
  }
  async delete(id: string) {
    return await this.prismaService.group.delete({ where: { id } });
  }
}
