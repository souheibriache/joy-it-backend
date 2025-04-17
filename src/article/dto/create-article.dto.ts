import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator'
import { CreateParagraphDto } from './create-paragraph.dto'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  title: string

  @ApiProperty()
  @IsString()
  subtitle: string

  @ApiProperty()
  @IsString()
  introduction: string

  @ApiProperty()
  @IsString()
  conclusion: string

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch (e) {
        throw new Error(`Invalid JSON for paragraphs: ${value}`)
      }
    }
    return value
  })
  tags: string[]

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Article thumbnail image',
  })
  @IsOptional()
  thumbnailUrl?: string

  @ApiPropertyOptional({
    type: [CreateParagraphDto],
    description: 'Paragraphs for the article',
  })
  @IsOptional()
  @Type(() => CreateParagraphDto)
  // @ValidateNested({ each: true })
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch (e) {
        throw new Error(`Invalid JSON for paragraphs: ${value}`)
      }
    }
    return value
  })
  paragraphs?: CreateParagraphDto[]
}
