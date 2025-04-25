import { ApiPropertyOptional } from '@nestjs/swagger'
import { PageOptionsDto } from '../../../libs/pagination/src/dto/page-options.dto'
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  Validate,
} from 'class-validator'
import { Type } from 'class-transformer'
import { OrderOptionsDto } from '../../../libs/pagination/src/dto/order-options.dto'
import { Transform } from 'class-transformer'
import { ActivityType } from '../enums/activity-type.enum'
import { IsUnique } from '@app/pagination/decorators/is-unique-decorator'
import { Int32 } from 'typeorm'

export class ActivityOptionsDto extends PageOptionsDto {
  // Filter properties moved directly into ActivityOptionsDto
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Invalid search field' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  readonly search?: string

  @ApiPropertyOptional({ enum: ActivityType })
  @IsEnum(ActivityType)
  @IsOptional()
  readonly type?: ActivityType

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (Number(value) === 0 ? 0 : Number(value)))
  readonly durationMin?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (Number(value) === 0 ? 1000 : Number(value)))
  readonly durationMax?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'Invalid value' })
  @Transform(({ value }) => true)
  readonly isAvailable?: boolean

  // Sort options remain the same
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => OrderOptionsDto)
  @Validate(IsUnique)
  readonly sort?: OrderOptionsDto
}
