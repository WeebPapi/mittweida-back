import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prismaService.user.create({ data: createUserDto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already in use');
        }
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          id,
        },
        include: { groups: {}, photos: {}, polls: {}, pollVotes: {} },
      });

      if (!user) {
        throw new NotFoundException('User with ID not found');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new NotFoundException('User with ID not found');
    }
  }

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      await this.findById(id);

      const updateAction = await this.prismaService.user.update({
        where: { id },
        data: updateUserDto,
      });
      return {
        message: 'Successfully Updated',
        id: updateAction.id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already in use');
        }
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prismaService.user.delete({ where: { id } });
  }
}
