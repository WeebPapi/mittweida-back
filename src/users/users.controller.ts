import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from 'generated/prisma';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getCurrentUserProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateCurrentUserProfile(
    @Request() req: any,
    @Body() updateUserDto: Prisma.UserUpdateInput,
  ) {
    return this.usersService.update(req.user.id, updateUserDto);
  }
  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  async deleteCurrentUserProfile(@Request() req) {
    return this.usersService.delete(req.user.id);
  }
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: string) {
    return this.usersService.findById(id);
  }
}
