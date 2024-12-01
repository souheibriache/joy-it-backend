import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateActivityMainImageDto {
  @ApiProperty()
  @IsUUID()
  imageId: string;
}
