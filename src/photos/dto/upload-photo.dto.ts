import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class UploadPhotoDto {
  @IsString()
  @IsOptional()
  caption?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsUUID()
  @IsOptional()
  groupId?: string;
}
