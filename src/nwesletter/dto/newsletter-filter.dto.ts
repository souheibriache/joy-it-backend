import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsOptional, IsString, IsArray } from 'class-validator'

export class NewsletterFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value) return value
    if (typeof value !== 'string') return value
    return value.trim().toLowerCase()
  })
  search?: string
}
