import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password for the user (minimum 8 characters)',
    example: 'SecurePassword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'The first name of the user', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'The last name of the user', example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: "Optional URL to the user's profile picture",
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({
    description: 'The role of the user',
    enum: ['ADMIN', 'USER', 'BUSINESS_OWNER'],
    example: 'USER',
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: 'ADMIN' | 'USER' | 'BUSINESS_OWNER';
}
