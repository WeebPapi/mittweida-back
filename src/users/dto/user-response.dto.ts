import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'generated/prisma';

export class UserResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({ description: 'The first name of the user', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'The last name of the user', example: 'Doe' })
  lastName: string;

  @ApiProperty({
    description: "Optional URL to the user's profile picture",
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profilePicture?: string;

  @ApiProperty({
    description: 'The role of the user',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'The date and time when the user was created',
    example: '2023-01-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the user was last updated',
    example: '2023-01-02T14:30:00.000Z',
  })
  updatedAt: Date;
}
