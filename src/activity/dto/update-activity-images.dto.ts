import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class UpdateActivityImagesDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  mainImageIndex: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  retainedImageIds?: string[];
}
