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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
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
  async login(
    @Res({ passthrough: true }) response: Response,
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

    return {
      message: 'Successfully logged in',
      user: credentials.user,
    };
  }
  @Post('logout')
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
