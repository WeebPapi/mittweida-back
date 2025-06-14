import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createUserDto: Prisma.UserCreateInput) {
    return this.prismaService.user.create({ data: createUserDto });
  }
  async findById(id: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          id,
        },
      });
      return user;
    } catch (error) {
      throw new NotFoundException('User with ID not found');
    }
  }
  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    return user;
  }

  async update(id: string, updateUserDto: Prisma.UserUpdateInput) {
    try {
      if (!(await this.findById(id))) {
        throw new NotFoundException('User with ID not found');
      }
      return this.prismaService.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      throw new Error(error);
    }
  }
  async delete(id: string) {
    if (!(await this.findById(id))) {
      throw new NotFoundException('User with ID not found');
    }
    return this.prismaService.user.delete({ where: { id } });
  }
}
