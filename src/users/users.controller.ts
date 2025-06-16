import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from 'generated/prisma';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import * as bcrypt from 'bcryptjs';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getCurrentUserProfile(@Req() req) {
    return this.usersService.findById(req.user.sub);
  }
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateCurrentUserProfile(
    @Req() req: any,
    @Body() updateUserDto: Prisma.UserUpdateInput,
  ) {
    if (updateUserDto.password)
      return this.usersService.update(req.user.sub, {
        ...updateUserDto,
        password: await bcrypt.hash(updateUserDto.password as string, 10),
      });
    else
      return this.usersService.update(req.user.sub, {
        ...updateUserDto,
      });
  }
  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  async deleteCurrentUserProfile(@Req() req) {
    return this.usersService.delete(req.user.sub);
  }
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
