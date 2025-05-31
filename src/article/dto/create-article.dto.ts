import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator'
import { CreateParagraphDto } from './create-paragraph.dto'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string

  @ApiProperty()
  @IsString()
  subtitle: string

  @ApiProperty()
  @IsString()
  introduction: string

  @ApiProperty()
  @IsString()
  conclusion: string

  @ApiProperty({ type: [CreateParagraphDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParagraphDto)
  @Transform(({ value }) => {
    if (!value) return []
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch (e) {
        return value
      }
    }
    return value
  })
  paragraphs: CreateParagraphDto[]

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (!value) return []
    if (typeof value === 'string') {
      try {
        return value.split(',').map((tag) => tag.trim())
      } catch (e) {
        return value
      }
    }
    return value
  })
  tags?: string[]

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Article thumbnail image',
  })
  @IsOptional()
  thumbnailUrl?: string
}
