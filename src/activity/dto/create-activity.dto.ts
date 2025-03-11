import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { ActivityType } from '../enums/activity-type.enum'

export class CreateActivityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  postalCode?: string

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  locationUrl?: string

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  duration: number

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  participants: number

  @ApiProperty({ type: Number, default: 0 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  mainImageIndex: number

  @ApiProperty({ type: Boolean, default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable: boolean

  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType, { each: true })
  type: ActivityType

  @ApiProperty({ isArray: true, default: [], nullable: true })
  @IsArray()
  @IsOptional()
  keyWords: string[]

  @ApiProperty({ type: Boolean, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  isInsideCompany: boolean
}
