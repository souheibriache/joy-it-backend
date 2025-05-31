import { ApiPropertyOptional } from '@nestjs/swagger'
import { PageOptionsDto } from '@app/pagination/dto'
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  Validate,
  IsArray,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import { OrderOptionsDto } from '../../../libs/pagination/src/dto/order-options.dto'
import { Transform } from 'class-transformer'
import { ActivityType } from '../enums/activity-type.enum'
import { IsUnique } from '@app/pagination/decorators/is-unique-decorator'
import { Order } from '@app/pagination/constants'

export class ActivityOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => {
    if (!value) return undefined
    const num = Number(value)
    return isNaN(num) ? value : num
  })
  page?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => {
    if (!value) return undefined
    const num = Number(value)
    return isNaN(num) ? value : num
  })
  take?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value) return undefined
    if (typeof value !== 'string') return value
    return value.trim().toLowerCase()
  })
  search?: string

  @ApiPropertyOptional({ enum: ActivityType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ActivityType, { each: true })
  @Transform(({ value }) => {
    if (!value) return undefined
    if (Array.isArray(value)) return value
    if (typeof value === 'string') return value.split(',').map((v) => v.trim())
    return value
  })
  types?: ActivityType[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (!value) return undefined
    const num = Number(value)
    return isNaN(num) ? value : num
  })
  durationMin?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (!value) return undefined
    const num = Number(value)
    return isNaN(num) ? value : num
  })
  durationMax?: number

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined
    return typeof value === 'string' ? value === 'true' : value
  })
  isAvailable?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  sort?: Record<string, Order>

  @ApiPropertyOptional({ enum: ActivityType })
  @IsOptional()
  @IsEnum(ActivityType)
  @Transform(({ value }) => {
    if (!value) return undefined
    return value
  })
  type?: ActivityType
}
