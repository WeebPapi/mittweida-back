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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'The current user profile',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getCurrentUserProfile(@Req() req: Request) {
    return this.usersService.findById((req.user as TokenPayload).id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'The updated user profile',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete current authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile successfully deleted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  async deleteCurrentUserProfile(@Req() req: Request) {
    return this.usersService.delete((req.user as TokenPayload).id);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'The user with the specified ID',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
