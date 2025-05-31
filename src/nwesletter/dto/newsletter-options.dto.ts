import { Transform } from 'class-transformer'
import { IsOptional, IsString, IsNumber, Min } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Order } from '@app/pagination/constants'
import { PageOptionsDto } from '@app/pagination/dto'

export class NewsletterOptionsDto extends PageOptionsDto {
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
  @Transform(({ value }) => {
    if (!value) return undefined
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch (e) {
        return value
      }
    }
    return value
  })
  sort?: Record<string, Order>
}
