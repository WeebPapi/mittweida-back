import { PartialType } from '@nestjs/mapped-types';
import { UploadPhotoDto } from './upload-photo.dto';

export class UpdatePhotoDto extends PartialType(UploadPhotoDto) {}
