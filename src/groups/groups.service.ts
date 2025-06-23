import { Injectable } from '@nestjs/common';
import { Group, Prisma, User } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private readonly prismaService: PrismaService) {}
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
  async instantiateGroupMember(user: User, group: Group) {
    const member = await this.prismaService.groupMember.create({
      data: {
        userId: user.id,
        groupId: group.id,
      },
    });
    return member;
  }
  async create(createGroupDto: Omit<Prisma.GroupCreateInput, 'code'>) {
    let code = await this.generateCode();
    const group = await this.prismaService.group.create({
      data: { ...createGroupDto, code },
    });
    return group;
  }
  async findGroup(id: string) {
    return this.prismaService.group.findUnique({ where: { id } });
  }
  async updateGroup(id: string, updateGroupDto: Prisma.GroupUpdateInput) {
    return this.prismaService.group.update({
      where: { id },
      data: updateGroupDto,
    });
  }
  async join(user: User, code: string) {
    const group = await this.prismaService.group.findUnique({
      where: { code },
    });
    const member = await this.instantiateGroupMember(user, group as Group);
    return await this.prismaService.group.update({
      where: { id: group?.id },
      data: member,
    });
  }
  async delete(id: string) {
    return await this.prismaService.group.delete({ where: { id } });
  }
}
