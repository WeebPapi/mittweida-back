// src/polls/dto/create-poll.dto.ts
import {
  IsString,
  IsDateString,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

export class CreatePollDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsUUID()
  @IsNotEmpty()
  groupId: string;

  @IsDateString()
  expiresAt: Date;

  @IsArray()
  @ArrayNotEmpty()
  selectedActivityIds: string[];
}
