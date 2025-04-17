import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateParagraphDto {
  @ApiProperty()
  @IsString()
  title: string

  @ApiProperty()
  @IsString()
  content: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  subtitle?: string

  @ApiPropertyOptional({
    description:
      'Optional image index from the uploaded files for this paragraph',
  })
  @IsOptional()
  @IsNumber()
  imageIndex?: number
}
