import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { User } from 'generated/prisma';
import { AuthService } from './auth.service';
import { LogInInfo } from './interfaces';
import { Response, Request } from 'express';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

class AuthSuccessResponseDto {
  @ApiProperty({
    description: 'A success message',
    example: 'Successfully registered',
  })
  message: string;

  @ApiProperty({ type: UserResponseDto, description: 'The user object' })
  user: UserResponseDto;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered.',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async register(
    @Res({ passthrough: true }) response: Response,
    @Body() formData: CreateUserDto,
  ) {
    const credentials = await this.authService.register(formData);
    response.cookie('access_token', credentials.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    response.cookie('refresh_token', credentials.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    return {
      message: 'Successfully registered',
      user: credentials.user,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiBody({ type: LogInInfo })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in.',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
    @Body() formData: LogInInfo,
  ) {
    const credentials = await this.authService.login(formData);

    response.cookie('access_token', credentials.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    response.cookie('refresh_token', credentials.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });
    console.log('Response body', response.getHeaders());

    return {
      message: 'Successfully logged in',
      user: credentials.user,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    return { message: 'Logged out successfully' };
  }

  @Post('refresh-token')
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Access token successfully refreshed.',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized, refresh token invalid or expired.',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const credentials = await this.authService.refresh(request.user as User);
      response.cookie('access_token', credentials.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
      });

      response.cookie('refresh_token', credentials.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
      });
      return { message: 'Successfully refreshed', user: credentials.user };
    } catch (error) {
      throw new UnauthorizedException('Token refresh failed');
    }
  }
}
