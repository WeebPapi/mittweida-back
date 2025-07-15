import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePollVoteDto {
  @ApiProperty({
    description: 'The ID of the poll option being voted for',
    format: 'uuid',
    example: 'c2d3e4f5-a6b7-8901-2345-67890abcdef0',
  })
  @IsUUID()
  @IsNotEmpty()
  pollOptionId: string;
}
