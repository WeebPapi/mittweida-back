import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadPhotoDto {
  @ApiProperty({
    description: 'Optional caption for the photo',
    required: false,
    example: 'A beautiful sunset over the mountains.',
  })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({
    description: 'Optional location where the photo was taken',
    required: false,
    example: 'Grand Canyon, Arizona',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Optional ID of the group this photo belongs to (UUID format)',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsOptional()
  groupId?: string;
}
