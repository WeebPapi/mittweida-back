import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { AuthService } from './auth.service';
import { LogInInfo } from './interfaces';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  async register(
    @Res() response: Response,
    @Body() formData: Prisma.UserCreateInput,
  ) {
    const credentials = await this.authService.register(formData);
    response.cookie('access_token', credentials.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.cookie('refresh_token', credentials.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return response.json();
  }
  @Post('login')
  async login(@Res() response: Response, formData: LogInInfo) {
    const credentials = await this.authService.login(formData);

    response.cookie('access_token', credentials.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.cookie('refresh_token', credentials.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return response.json();
  }
  @Post('logout')
  async logout(@Res() response: Response) {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return response.json({ message: 'Logged out successfully' });
  }
  @Post('refresh-token')
  async refresh(@Req() request: Request, @Res() response: Response) {
    try {
      const refreshToken = request.cookies['refresh_token'];

      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      const result = await this.authService.refresh(refreshToken);

      response.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      response.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return response.json({ user: result.user });
    } catch (error) {
      throw new UnauthorizedException('Token refresh failed');
    }
  }
}
