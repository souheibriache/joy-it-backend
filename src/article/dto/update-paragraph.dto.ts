import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID } from 'class-validator'

export class UpdateParagraphDto {
  @ApiProperty({ description: 'Paragraph title' })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional new image for the paragraph',
  })
  @IsOptional()
  imageUrl?: string
}
