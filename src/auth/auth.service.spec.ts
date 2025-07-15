import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from 'generated/prisma';

jest.mock('bcryptjs', () => ({
  hash: jest.fn((data) => Promise.resolve(`hashed_${data}`)),
  compare: jest.fn((data, hashed) => {
    if (hashed === null || hashed === undefined) {
      return Promise.resolve(false);
    }
    return Promise.resolve(data === hashed.replace('hashed_', ''));
  }),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashed_password',
    firstName: 'Test',
    lastName: 'User',
    profilePicture: null,
    role: UserRole.USER,
    refresh_token: 'hashed_refresh_token',
    createdAt: new Date(),
    updatedAt: new Date(),
    groups: [],
    photos: [],
    polls: [],
    pollVotes: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_TOKEN_SECRET') return 'access_secret';
              if (key === 'JWT_REFRESH_TOKEN_SECRET') return 'refresh_secret';
              return '';
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateRefresh', () => {
    it('should return user if refresh token is valid', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateRefresh(
        'valid_token',
        mockUser.id,
      );
      expect(result).toEqual(mockUser);
      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'valid_token',
        mockUser.refresh_token,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.validateRefresh('any_token', 'non-existent-id'),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.findById).toHaveBeenCalledWith('non-existent-id');

      expect(bcrypt.compare).toHaveBeenCalledWith('any_token', undefined);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.validateRefresh('invalid_token', mockUser.id),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'invalid_token',
        mockUser.refresh_token,
      );
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens and update user', async () => {
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('mock_access_token')
        .mockReturnValueOnce('mock_refresh_token');
      (usersService.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.generateTokens(mockUser);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { id: mockUser.id, email: mockUser.email, role: mockUser.role },
        { secret: 'access_secret', expiresIn: '15m' },
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { id: mockUser.id, email: mockUser.email, role: mockUser.role },
        { secret: 'refresh_secret', expiresIn: '7d' },
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('mock_refresh_token', 10);
      expect(usersService.update).toHaveBeenCalledWith(mockUser.id, {
        refresh_token: 'hashed_mock_refresh_token',
      });

      expect(result).toEqual({
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      });
    });
  });

  describe('register', () => {
    it('should register a new user and generate tokens', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'newpassword123',
        firstName: 'New',
        lastName: 'User',
      };
      const newUser = {
        ...mockUser,
        email: createUserDto.email,
        password: 'hashed_newpassword123',
      };

      (usersService.create as jest.Mock).mockResolvedValue(newUser);
      jest.spyOn(authService, 'generateTokens').mockResolvedValue({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      });

      const result = await authService.register(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        password: 'hashed_newpassword123',
      });
      expect(authService.generateTokens).toHaveBeenCalledWith(newUser);
      expect(result).toEqual({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      });
    });
  });

  describe('login', () => {
    it('should log in a user and generate tokens on valid credentials', async () => {
      const logInInfo = { email: 'test@example.com', password: 'password123' };

      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(authService, 'generateTokens').mockResolvedValue({
        access_token: 'login_access_token',
        refresh_token: 'login_refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      });

      const result = await authService.login(logInInfo);

      expect(usersService.findByEmail).toHaveBeenCalledWith(logInInfo.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        logInInfo.password,
        mockUser.password,
      );
      expect(authService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        access_token: 'login_access_token',
        refresh_token: 'login_refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      });
    });

    it('should throw UnauthorizedException on invalid email', async () => {
      const logInInfo = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(logInInfo)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(logInInfo.email);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const logInInfo = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(logInInfo)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(logInInfo.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        logInInfo.password,
        mockUser.password,
      );
    });

    it('should throw UnauthorizedException on any error during login', async () => {
      const logInInfo = { email: 'test@example.com', password: 'password123' };

      (usersService.findByEmail as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(authService.login(logInInfo)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(logInInfo.email);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh tokens for a given user', async () => {
      jest.spyOn(authService, 'generateTokens').mockResolvedValue({
        access_token: 'refreshed_access_token',
        refresh_token: 'refreshed_refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      });

      const result = await authService.refresh(mockUser);

      expect(authService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        access_token: 'refreshed_access_token',
        refresh_token: 'refreshed_refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      });
    });
  });
});
