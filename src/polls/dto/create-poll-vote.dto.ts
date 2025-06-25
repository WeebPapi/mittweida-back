import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreatePollVoteDto {
  @IsUUID()
  @IsNotEmpty()
  pollOptionId: string;
}
