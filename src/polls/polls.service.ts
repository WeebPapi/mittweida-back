import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PollsService {
  constructor(private readonly prismaService: PrismaService) {}
  async findById(id: string) {
    return this.prismaService.poll.findUnique({ where: { id } });
  }
  async create(createPollDto: Prisma.PollCreateInput) {
    return this.prismaService.poll.create({ data: createPollDto });
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
