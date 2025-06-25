import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import * as bcrypt from 'bcryptjs';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';
import { TokenPayload } from 'src/auth/interfaces';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getCurrentUserProfile(@Req() req: Request) {
    return this.usersService.findById((req.user as TokenPayload).id);
  }
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateCurrentUserProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (updateUserDto.password)
      return this.usersService.update((req.user as TokenPayload).id, {
        ...updateUserDto,
        password: await bcrypt.hash(updateUserDto.password as string, 10),
      });
    else
      return this.usersService.update((req.user as TokenPayload).id, {
        ...updateUserDto,
      });
  }
  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  async deleteCurrentUserProfile(@Req() req: Request) {
    return this.usersService.delete((req.user as TokenPayload).id);
  }
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
