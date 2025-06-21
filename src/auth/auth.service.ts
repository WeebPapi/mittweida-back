// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Prisma, User } from 'generated/prisma';
import { LogInInfo } from './interfaces';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async validateRefresh(refresh_token: string, id: string) {
    const user = await this.usersService.findById(id);
    const compare = await bcrypt.compare(refresh_token, user?.refresh_token!);
    if (!user || !compare) throw new UnauthorizedException();

    return user;
  }
  async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const returnObj = {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: '15m',
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: '7d',
      }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };

    await this.usersService.update(user.id, {
      refresh_token: await bcrypt.hash(returnObj.refresh_token, 10),
    });

    return returnObj;
  }
  async register(createUserDto: Prisma.UserCreateInput) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.usersService.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      password: hashedPassword,
    });
    return this.generateTokens(user);
  }
  async login(logInInfo: LogInInfo) {
    try {
      const user = await this.usersService.findByEmail(logInInfo.email);

      if (!user || !(await bcrypt.compare(logInInfo.password, user.password))) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
  async refresh(user: User) {
    const creds = await this.generateTokens(user);
    return creds;
  }
}
