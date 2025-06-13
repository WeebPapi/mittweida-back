import { Controller, Get, Post, Request } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { AuthService } from './auth.service';
import { LogInInfo } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  register(createUserDto: Prisma.UserCreateInput) {
    return this.authService.register(createUserDto);
  }
  @Post('login')
  login(formData: LogInInfo) {
    return this.authService.login(formData);
  }
  @Post('logout')
  logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }
  @Post('refresh-token')
  refresh(@Request() req) {
    return this.authService.refresh(req.user.id);
  }
}
