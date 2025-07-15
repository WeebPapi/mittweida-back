import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'The refresh token for the user, used for re-authentication.',
    example: 'someLongRefreshTokenString',
    required: false,
  })
  @IsString()
  @IsOptional()
  refresh_token?: string;
}
