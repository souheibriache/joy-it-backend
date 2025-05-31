import { IsUnique } from '@app/pagination/decorators/is-unique-decorator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator'
import { ActivityType } from '../enums/activity-type.enum'

export class ActivityFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Invalid search field' })
  @Transform(({ value }) => {
    if (!value) return value
    if (typeof value !== 'string') return value
    return value.trim().toLowerCase()
  })
  search?: string

  @ApiPropertyOptional({ enum: ActivityType, isArray: true })
  @IsEnum(ActivityType, {
    each: true,
    message: 'Invalid type',
  })
  @IsOptional()
  @Validate(IsUnique)
  types?: ActivityType[]

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => Number(value) || null)
  durationMin?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => Number(value) || null)
  durationMax?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined
    return typeof value === 'string' ? value === 'true' : value
  })
  @IsBoolean()
  isAvailable?: boolean
}
