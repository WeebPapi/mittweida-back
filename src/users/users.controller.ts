import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from 'generated/prisma';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('profile')
  async getCurrentUserProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }
  @Put('profile')
  async updateCurrentUserProfile(
    @Request() req: any,
    @Body() updateUserDto: Prisma.UserUpdateInput,
  ) {
    return this.usersService.update(req.user.id, updateUserDto);
  }
  @Delete('profile')
  async deleteCurrentUserProfile(@Request() req) {
    return this.usersService.delete(req.user.id);
  }
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: string) {
    return this.usersService.findById(id);
  }
}
