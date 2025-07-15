import {
  IsOptional,
  IsString,
  IsNumber,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ActivitySearch {
  @ApiProperty({
    description: 'A search query to find activities by name or description',
    required: false,
    example: 'park fun',
  })
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiProperty({
    description:
      'Comma-separated list of categories to filter activities (e.g., "Outdoors,Food"). Your service splits this.',
    required: false,
    example: 'Outdoors,Sports',
  })
  @IsOptional()
  @IsString()
  categories?: string;

  @ApiProperty({
    description: 'Latitude for proximity search (requires longitude)',
    required: false,
    example: 34.0522,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  @Transform(({ value }) => parseFloat(value))
  latitude?: number;

  @ApiProperty({
    description: 'Longitude for proximity search (requires latitude)',
    required: false,
    example: -118.2437,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  @Transform(({ value }) => parseFloat(value))
  longitude?: number;

  @ApiProperty({
    description: 'Maximum number of activities to return',
    required: false,
    example: 15,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;

  @ApiProperty({
    description: 'Number of activities to skip for pagination',
    required: false,
    example: 0,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number;
}
