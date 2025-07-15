import { Type } from 'class-transformer';
import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
  IsNotEmpty,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePollDto {
  @ApiProperty({
    description: 'The question for the poll',
    example: 'What is your favorite color?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'The ID of the group this poll belongs to',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  groupId: string;

  @ApiProperty({
    description: 'The date and time when the poll expires',
    type: String,
    format: 'date-time',
    example: '2025-12-31T23:59:59Z',
  })
  @Type(() => Date)
  @IsDate()
  expiresAt: Date;

  @ApiProperty({
    description: 'A list of activity IDs to be included in the poll options',
    type: [String],
    example: ['uuid1', 'uuid2', 'uuid3'],
    minItems: 1,
  })
  @IsArray()
  @ArrayNotEmpty()
  selectedActivityIds: string[];
}
