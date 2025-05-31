import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsOptional, IsString, IsArray } from 'class-validator'

export class ArticleFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value) return value
    if (typeof value !== 'string') return value
    return value.trim().toLowerCase()
  })
  search?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (!value) return value
    if (Array.isArray(value)) return value
    if (typeof value === 'string') return value.split(',')
    return value
  })
  tags?: string[]
}
