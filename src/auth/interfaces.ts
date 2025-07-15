import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export interface LogInInfoInterface {
  email: string;
  password: string;
}
export class LogInInfo {
  @ApiProperty({
    description: 'The email of the user',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password123',
  })
  @IsString()
  password: string;
}
export interface TokenPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'BUSINESS_OWNER' | 'USER';
  iat: number;
  exp: number;
}
