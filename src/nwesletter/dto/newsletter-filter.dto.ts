import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsOptional, IsString, IsArray } from 'class-validator'

export class NewsletterFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  search?: string
}
