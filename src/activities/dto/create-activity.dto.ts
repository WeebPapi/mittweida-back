import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUrl,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({
    description: 'The name of the activity',
    example: 'Adventure Park Fun',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'A detailed description of the activity',
    example: 'An exciting park with various rides and attractions.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The physical address of the activity location',
    example: '123 Main St, Anytown',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'The latitude coordinate of the activity location',
    example: 34.0522,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'The longitude coordinate of the activity location',
    example: -118.2437,
  })
  @IsNumber()
  longitude: number;

  @ApiProperty({
    description: 'Optional URL to a video showcasing the activity',
    example: 'https://example.com/activity-video.mp4',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  videoUrl?: string | null;

  @ApiProperty({
    description: 'Optional URL to an image representing the activity',
    example: 'https://example.com/activity-image.jpg',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string | null;

  @ApiProperty({
    description:
      'The category of the activity (e.g., "Outdoors", "Food", "Sports")',
    example: 'Outdoors',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description:
      'JSON object for opening hours. This field is optional. Example: {"monday": {"open": "09:00", "close": "17:00"}}',
    example: {
      monday: { open: '09:00', close: '17:00' },
      weekend: { open: '10:00', close: '18:00' },
    },
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  openHours?: any | null;

  @ApiProperty({
    description: 'List of image URLs for the activity gallery',
    type: [String],
    example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    required: false,
    nullable: true,
  })
  @ApiProperty({
    description: 'List of image URLs for the activity gallery',
    type: [String],
    example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery_images?: string[];
}
